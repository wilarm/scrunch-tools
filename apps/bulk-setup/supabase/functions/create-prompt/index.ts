import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SCRUNCH_API_BASE = "https://api.scrunchai.com/v1";

type CreatePromptPayload = {
  text: string;
  persona_id?: number | null;
  stage: "Advice" | "Awareness" | "Evaluation" | "Comparison" | "Other";
  tags?: string[];
  platforms: string[];
};

interface RequestBody {
  apiKey: string;
  brandId: number;
  payload: CreatePromptPayload;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { apiKey, brandId, payload }: RequestBody = await req.json();

    if (!apiKey || !apiKey.trim()) {
      return new Response(
        JSON.stringify({ error: "API key is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!brandId) {
      return new Response(
        JSON.stringify({ error: "Brand ID is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!payload || !payload.text || !payload.stage || !payload.platforms || payload.platforms.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: text, stage, platforms" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const response = await fetch(`${SCRUNCH_API_BASE}/${brandId}/prompts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let responseData: any;

    try {
      responseData = responseText ? JSON.parse(responseText) : null;
    } catch {
      responseData = { error: responseText || "Unknown error" };
    }

    if (!response.ok) {
      let errorMessage = "Unknown error";

      if (responseData?.message) {
        errorMessage = responseData.message;
      } else if (Array.isArray(responseData?.detail)) {
        errorMessage = responseData.detail
          .map((d: any) => d.msg ?? JSON.stringify(d))
          .join("; ");
      } else if (responseData?.detail) {
        errorMessage = typeof responseData.detail === "string"
          ? responseData.detail
          : JSON.stringify(responseData.detail);
      } else if (responseText) {
        errorMessage = responseText;
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: response.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
