const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  apiKey: string;
  brandId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
  endpoint?: 'responses' | 'query' | 'brands';
  fields?: string[];
  filterPlatforms?: string[];
  filterStages?: string[];
}

type ScrunchResponse =
  | Record<string, unknown>[]
  | { items: Record<string, unknown>[]; total?: number }
  | { data: Record<string, unknown>[]; total?: number }
  | { results: Record<string, unknown>[]; total?: number }
  | { error?: string; [key: string]: unknown };

function extractItems(json: ScrunchResponse): Record<string, unknown>[] {
  if (Array.isArray(json)) {
    return json;
  }

  if (typeof json === 'object' && json !== null) {
    if ('items' in json && Array.isArray(json.items)) {
      return json.items;
    }

    if ('data' in json && Array.isArray(json.data)) {
      return json.data;
    }

    if ('results' in json && Array.isArray(json.results)) {
      return json.results;
    }
  }

  return [];
}

interface Citation {
  domain?: string;
  source_type?: string;
  title?: string;
  url?: string;
}

interface Competitor {
  id?: string;
  name?: string;
  present?: boolean;
  position?: number;
  sentiment?: string;
}

interface Response {
  id?: string;
  created_at?: string;
  platform?: string;
  country?: string;
  prompt_id?: string;
  prompt?: string;
  response_text?: string;
  stage?: string;
  branded?: boolean;
  persona_id?: string;
  persona_name?: string;
  tags?: string[];
  key_topics?: string[];
  brand_present?: boolean;
  brand_sentiment?: string;
  brand_position?: number;
  competitors_present?: string[];
  citations?: Citation[];
  competitors?: Competitor[];
}

function flattenResponse(response: Response): Record<string, unknown> {
  const flattened: Record<string, unknown> = {
    id: response.id || "",
    created_at: response.created_at || "",
    platform: response.platform || "",
    country: response.country || "",
    prompt_id: response.prompt_id || "",
    prompt: response.prompt || "",
    response_text: response.response_text || "",
    stage: response.stage || "",
    branded: response.branded || "",
    persona_id: response.persona_id || "",
    persona_name: response.persona_name || "",
    tags: (response.tags || []).join("|"),
    key_topics: (response.key_topics || []).join("|"),
    brand_present: response.brand_present || "",
    brand_sentiment: response.brand_sentiment || "",
    brand_position: response.brand_position || "",
    competitors_present: (response.competitors_present || []).join("|"),
  };

  const citations = response.citations || [];
  flattened['citations'] = citations
    .map(c => c.url || '')
    .filter(Boolean)
    .join('|');

  return flattened;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { apiKey, brandId, startDate, endDate, endpoint = 'responses', fields = [], filterPlatforms = [], filterStages = [], limit = 100, offset = 0 }: RequestBody = await req.json();

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing required parameter: apiKey" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // For brands endpoint, we don't need brandId, startDate, endDate
    if (endpoint !== 'brands' && (!brandId || !startDate || !endDate)) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (endpoint === 'brands') {
      // Brands endpoint - list all brands
      const url = new URL(`https://api.scrunchai.com/v1/brands`);
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("offset", offset.toString());

      const response = await fetch(url.toString(), {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({
            error: `Scrunch API error: ${response.status} ${response.statusText}`,
            details: errorText,
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const data: ScrunchResponse = await response.json();

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (endpoint === 'query') {
      if (fields.length === 0) {
        return new Response(
          JSON.stringify({ error: "Fields parameter is required for query endpoint" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const url = new URL(`https://api.scrunchai.com/v1/${brandId}/query`);
      url.searchParams.append("start_date", startDate);
      url.searchParams.append("end_date", endDate);
      url.searchParams.append("fields", fields.join(","));
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("offset", offset.toString());
      if (filterPlatforms && filterPlatforms.length > 0) {
        filterPlatforms.forEach(p => url.searchParams.append("platform", p));
      }
      if (filterStages && filterStages.length > 0) {
        filterStages.forEach(s => url.searchParams.append("stage", s));
      }

      const response = await fetch(url.toString(), {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({
            error: `Scrunch API error: ${response.status} ${response.statusText}`,
            details: errorText,
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const data: ScrunchResponse = await response.json();

      if (typeof data === 'object' && data !== null && 'error' in data && data.error) {
        return new Response(
          JSON.stringify({
            error: `Scrunch API error: ${data.error}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const items = extractItems(data);

      return new Response(JSON.stringify({ items, total: items.length }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Responses endpoint - fetch single page and flatten
      const url = new URL(`https://api.scrunchai.com/v1/${brandId}/responses`);
      url.searchParams.append("start_date", startDate);
      url.searchParams.append("end_date", endDate);
      url.searchParams.append("limit", limit.toString());
      url.searchParams.append("offset", offset.toString());
      if (fields && fields.length > 0) {
        url.searchParams.append("fields", fields.join(","));
      }
      if (filterPlatforms && filterPlatforms.length > 0) {
        filterPlatforms.forEach(p => url.searchParams.append("platform", p));
      }
      if (filterStages && filterStages.length > 0) {
        filterStages.forEach(s => url.searchParams.append("stage", s));
      }

      const response = await fetch(url.toString(), {
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Accept": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return new Response(
          JSON.stringify({
            error: `Scrunch API error: ${response.status} ${response.statusText}`,
            details: errorText,
          }),
          {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const data: ScrunchResponse = await response.json();

      if (typeof data === 'object' && data !== null && 'error' in data && data.error) {
        return new Response(
          JSON.stringify({
            error: `Scrunch API error: ${data.error}`,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const items = extractItems(data);
      const flattenedItems = items.map(item => flattenResponse(item as Response));

      return new Response(JSON.stringify({ items: flattenedItems, total: flattenedItems.length }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
