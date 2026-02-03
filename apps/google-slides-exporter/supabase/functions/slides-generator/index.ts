import {
  createSheet,
  createAndLinkDonutChart,
  copyTemplateAndLinkCharts,
  inchesToEmu,
  type DonutChartConfig,
} from './sheets.ts';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ChartConfig {
  title: string;
  data: Array<{ label: string; value: number }>;
  sheetName: string;
  slideObjectId?: string;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface GenerateRequest {
  accessToken: string;
  templateId: string;
  slideName: string;
  replacements: Record<string, string>;
  charts?: ChartConfig[];
  sheetsTemplateId?: string; // Optional: ID of pre-styled Google Sheets template with charts
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

interface PageElement {
  objectId?: string;
  size?: {
    width?: { magnitude?: number };
    height?: { magnitude?: number };
  };
  transform?: {
    scaleX?: number;
    scaleY?: number;
    translateX?: number;
    translateY?: number;
    unit?: string;
  };
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
  objectId?: string;
  pageElements?: PageElement[];
}

interface PresentationResponse {
  slides?: Slide[];
}

async function copyTemplate(
  accessToken: string,
  templateId: string,
  name: string
): Promise<{ id: string }> {
  // Add supportsAllDrives=true to allow copying templates shared "Anyone with the link"
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${templateId}/copy?supportsAllDrives=true`,
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

// Helper function to convert EMU to inches
function emuToInches(emu: number): number {
  return emu / 914400;
}

// Find positions of chart placeholders in the presentation
async function findChartPlaceholderPositions(
  presentation: PresentationResponse,
  chartPlaceholders: string[]
): Promise<Map<string, { slideObjectId: string; x: number; y: number; width: number; height: number }>> {
  const positions = new Map();

  const slides = presentation.slides || [];
  for (const slide of slides) {
    const elements = slide.pageElements || [];

    for (const element of elements) {
      if (!element.shape?.text) continue;

      // Get text content from this element
      const textElements = element.shape.text.textElements || [];
      const content = textElements
        .map(te => te.textRun?.content || '')
        .join('');

      // Check if this element contains any chart placeholder
      for (const placeholder of chartPlaceholders) {
        if (content.includes(placeholder)) {
          // Extract position and size from the element
          const transform = element.transform || {};
          const size = element.size || {};

          positions.set(placeholder, {
            slideObjectId: slide.objectId!,
            x: emuToInches(transform.translateX || 0),
            y: emuToInches(transform.translateY || 0),
            width: emuToInches(size.width?.magnitude || inchesToEmu(3)),
            height: emuToInches(size.height?.magnitude || inchesToEmu(3)),
          });

          console.log(`Found chart placeholder ${placeholder} at position:`, positions.get(placeholder));
        }
      }
    }
  }

  return positions;
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
    const { accessToken, templateId, slideName, replacements, charts, sheetsTemplateId }: GenerateRequest = await req.json();

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

    // Step 2: Find chart placeholder positions BEFORE replacing text
    let chartPlaceholderPositions = new Map();
    let spreadsheetId: string | undefined;
    let spreadsheetUrl: string | undefined;

    if (charts && charts.length > 0) {
      // Get the presentation to find chart placeholders
      const presentation = await getPresentation(accessToken, deckId);

      // Build list of chart placeholder names
      const chartPlaceholders = charts.map(c => `{{${c.title.toLowerCase().replace(/\s+/g, '_')}_chart}}`);

      // Find positions of chart placeholders in the template
      chartPlaceholderPositions = await findChartPlaceholderPositions(presentation, chartPlaceholders);

      // Add chart placeholders to replacements (will be replaced with empty string)
      for (const placeholder of chartPlaceholders) {
        replacements[placeholder] = '';
      }
    }

    // Step 3: Replace placeholders (including removing chart placeholders)
    await replaceTextInSlides(accessToken, deckId, replacements);

    // Step 4: Create charts if requested
    if (charts && charts.length > 0) {
      const sheetName = `${slideName} - Data`;

      // Check if we should use template approach or create charts via API
      if (sheetsTemplateId) {
        // Template approach: Copy pre-styled sheets template and update data
        console.log('Using sheets template approach with template:', sheetsTemplateId);

        const result = await copyTemplateAndLinkCharts(
          accessToken,
          sheetsTemplateId,
          deckId,
          charts.map(c => ({
            title: c.title,
            data: c.data,
            sheetName: c.sheetName,
          })),
          chartPlaceholderPositions,
          sheetName
        );

        spreadsheetId = result.spreadsheetId;
        spreadsheetUrl = result.spreadsheetUrl;
      } else {
        // API approach: Create blank sheet and generate charts via API
        console.log('Using API approach to create charts');

        const sheet = await createSheet(accessToken, sheetName);
        spreadsheetId = sheet.id;
        spreadsheetUrl = sheet.spreadsheetUrl;

        // Get the presentation again to find slide IDs (after text replacement)
        const presentation = await getPresentation(accessToken, deckId);
        const slides = presentation.slides || [];

        // Create each chart
        for (const chartConfig of charts) {
        // Build the expected placeholder name
        const placeholderName = `{{${chartConfig.title.toLowerCase().replace(/\s+/g, '_')}_chart}}`;

        // Check if we found a position for this chart's placeholder
        const placeholderPosition = chartPlaceholderPositions.get(placeholderName);

        let slideObjectId: string;
        let position: { x: number; y: number; width: number; height: number };

        if (placeholderPosition) {
          // Use the position from the placeholder
          slideObjectId = placeholderPosition.slideObjectId;
          position = {
            x: placeholderPosition.x,
            y: placeholderPosition.y,
            width: placeholderPosition.width,
            height: placeholderPosition.height,
          };
          console.log(`Using placeholder position for ${chartConfig.title}:`, position);
        } else {
          // Fall back to config-specified position or default
          slideObjectId = chartConfig.slideObjectId || slides[0]?.objectId || '';
          position = chartConfig.position || {
            x: 3.5,
            y: 2,
            width: 3,
            height: 3,
          };
          console.log(`Using fallback position for ${chartConfig.title}:`, position);
        }

        if (!slideObjectId) {
          console.warn('No slide found to place chart on');
          continue;
        }

        await createAndLinkDonutChart(
          accessToken,
          spreadsheetId,
          deckId,
          {
            title: chartConfig.title,
            data: chartConfig.data,
            sheetName: chartConfig.sheetName,
          },
          {
            slideObjectId,
            x: inchesToEmu(position.x),
            y: inchesToEmu(position.y),
            width: inchesToEmu(position.width),
            height: inchesToEmu(position.height),
          }
        );
        }
      }
    }

    // Step 4: Return result
    return new Response(
      JSON.stringify({
        deckId,
        link: `https://docs.google.com/presentation/d/${deckId}/edit`,
        spreadsheetId,
        spreadsheetUrl,
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
