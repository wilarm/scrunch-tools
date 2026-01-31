const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface GenerateRequest {
  accessToken: string;
  templateId: string;
  slideName: string;
  replacements: Record<string, string>;
}

interface PreviewRequest {
  accessToken: string;
  templateId: string;
}

interface SlideElement {
  shape?: {
    text?: {
      textElements?: Array<{
        textRun?: {
          content?: string;
        };
      }>;
    };
  };
}

interface Slide {
  pageElements?: SlideElement[];
}

interface PresentationResponse {
  slides?: Slide[];
}

async function copyTemplate(
  accessToken: string,
  templateId: string,
  name: string
): Promise<{ id: string }> {
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${templateId}/copy`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to copy template: ${error}`);
  }

  return await response.json();
}

async function replaceTextInSlides(
  accessToken: string,
  presentationId: string,
  replacements: Record<string, string>
): Promise<void> {
  const requests = Object.entries(replacements).map(([placeholder, value]) => ({
    replaceAllText: {
      containsText: {
        text: placeholder,
        matchCase: false,
      },
      replaceText: value,
    },
  }));

  const response = await fetch(
    `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update slides: ${error}`);
  }
}

async function getPresentation(
  accessToken: string,
  presentationId: string
): Promise<PresentationResponse> {
  const response = await fetch(
    `https://slides.googleapis.com/v1/presentations/${presentationId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get presentation: ${error}`);
  }

  return await response.json();
}

function extractPlaceholders(presentation: PresentationResponse): string[] {
  const placeholders = new Set<string>();
  const placeholderRegex = /\{\{[^}]+\}\}/g;

  const slides = presentation.slides || [];
  for (const slide of slides) {
    const elements = slide.pageElements || [];
    for (const element of elements) {
      const textElements = element.shape?.text?.textElements || [];
      for (const textElement of textElements) {
        const content = textElement.textRun?.content || '';
        const matches = content.match(placeholderRegex);
        if (matches) {
          matches.forEach(match => placeholders.add(match));
        }
      }
    }
  }

  return Array.from(placeholders).sort();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Preview endpoint - validate template and return info
    if (path.endsWith('/preview')) {
      const { accessToken, templateId }: PreviewRequest = await req.json();

      if (!accessToken || !templateId) {
        return new Response(
          JSON.stringify({ error: "Missing required parameters" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get presentation to validate access and extract info
      const presentation = await getPresentation(accessToken, templateId);
      const placeholders = extractPlaceholders(presentation);
      const slideCount = presentation.slides?.length || 0;

      return new Response(
        JSON.stringify({
          placeholders,
          slideCount,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Main generation endpoint
    const { accessToken, templateId, slideName, replacements }: GenerateRequest = await req.json();

    if (!accessToken || !templateId || !slideName || !replacements) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Copy template
    const newDeck = await copyTemplate(accessToken, templateId, slideName);
    const deckId = newDeck.id;

    // Step 2: Replace placeholders
    await replaceTextInSlides(accessToken, deckId, replacements);

    // Step 3: Return result
    return new Response(
      JSON.stringify({
        deckId,
        link: `https://docs.google.com/presentation/d/${deckId}/edit`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error('Slides generator error:', message);

    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
