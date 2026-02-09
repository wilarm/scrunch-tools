import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface BrandInput {
  name: string;
  website: string;
}

interface BrandLocationResult {
  name: string;
  website: string;
  primary_location: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured in environment" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { brands }: { brands: BrandInput[] } = await req.json();

    if (!brands || !Array.isArray(brands) || brands.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing or empty brands array" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openai = new OpenAI({ apiKey: openaiKey });

    const brandList = brands
      .map((b, i) => `${i + 1}. ${b.name} (${b.website})`)
      .join("\n");

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "system",
          content: `You are a business research assistant. Given a list of brands, return each brand's primary headquarters location.

Return valid JSON only — an array matching the input order:
[
  { "name": "Brand Name", "website": "https://example.com", "primary_location": "City, ST" },
  ...
]

Format rules:
- US locations: "City, ST" using 2-letter state code (e.g., "San Francisco, CA")
- International locations: "City, Country" (e.g., "London, UK")
- Use the city where the main corporate headquarters is located
- Return the array in the same order as the input`,
        },
        {
          role: "user",
          content: `Return the primary headquarters location for each brand:\n\n${brandList}`,
        },
      ],
    });

    const content = response.output_text;
    if (!content) throw new Error("No content returned from OpenAI");

    const results: BrandLocationResult[] = JSON.parse(content);

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Batch enrichment error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
