import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SCRUNCH_API_BASE = "https://api.scrunchai.com/v1";

interface RequestBody {
  apiKey: string;
  limit?: number;
  offset?: number;
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

    const { apiKey, limit = 1000, offset = 0 }: RequestBody = await req.json();

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

    const url = `${SCRUNCH_API_BASE}/brands?limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
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
