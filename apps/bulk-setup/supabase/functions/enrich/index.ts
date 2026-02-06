import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "npm:openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const enrichmentCache = new Map<string, any>();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured in environment" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { website, brandName } = await req.json();
    if (!website) {
      return new Response(
        JSON.stringify({ error: "Missing website parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (enrichmentCache.has(website)) {
      console.log(`Cache hit for ${website}`);
      return new Response(
        JSON.stringify(enrichmentCache.get(website)),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const openai = new OpenAI({
      apiKey: openaiKey,
    });

    const systemPrompt = `Given a single website URL, use web search and the brand's own pages to determine:

1. Brand name (the official company/brand name)
2. 2 to 6 alternative names (only if supported by evidence - could be variations, former names, or commonly used abbreviations)
3. Primary location (city, region/state, country where the brand is primarily based)
4. 5 likely competitors with their most commonly used name and canonical domains. If you are between two names as the most common, pick the shorter of the two.

Return valid JSON only, matching this schema exactly:

{
  "website": "the input URL",
  "name": "Brand Name",
  "alternative_names": ["Alt 1", "Alt 2"],
  "primary_location": {
    "city": "City",
    "region": "State/Province",
    "country": "Country",
    "confidence": 0.95
  },
  "competitors": [
    { 
      "name": "Competitor Name", 
      "websites": ["https://competitor.com"], 
      "confidence": 0.85 
    }
  ],
  "evidence": {
    "name_sources": ["https://source1.com"],
    "location_sources": ["https://source2.com"],
    "competitor_sources": ["https://source3.com"]
  }
}

Include confidence scores from 0 to 1. Include evidence links (sources) for each category.`;

const response = await openai.responses.create({
  model: "gpt-5-mini", // or gpt-5, gpt-4o-mini, etc.
  tools: [{ type: "web_search" }],
  input: [
    {
      role: "system",
      content: systemPrompt,
    },
    {
      role: "user",
      content: brandName
        ? `Research the brand "${brandName}" (website: ${website}). Return their official name, alternative names, headquarters location, and top competitors.`
        : `Research this website and provide enrichment data: ${website}`,
    },
  ],
  // If your SDK/version supports structured outputs here, use json_schema.
  // Otherwise keep it simple and rely on strict prompting + JSON.parse.
});

const content = response.output_text;
if (!content) throw new Error("No content returned from OpenAI");

const result = JSON.parse(content);
    
    result.website = website;
    
    enrichmentCache.set(website, result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Enrichment error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
