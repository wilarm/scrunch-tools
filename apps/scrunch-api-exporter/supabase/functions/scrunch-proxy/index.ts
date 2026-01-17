const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  apiKey: string;
  brandId: string;
  startDate: string;
  endDate: string;
  limit?: number;
  offset?: number;
  fetchAll?: boolean;
  endpoint?: 'responses' | 'query';
  fields?: string[];
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
  for (let i = 1; i <= 5; i++) {
    const citation = citations[i - 1];
    if (citation) {
      flattened[`citation_${i}_domain`] = citation.domain || "";
      flattened[`citation_${i}_source_type`] = citation.source_type || "";
      flattened[`citation_${i}_title`] = citation.title || "";
      flattened[`citation_${i}_url`] = citation.url || "";
    } else {
      flattened[`citation_${i}_domain`] = "";
      flattened[`citation_${i}_source_type`] = "";
      flattened[`citation_${i}_title`] = "";
      flattened[`citation_${i}_url`] = "";
    }
  }

  const competitors = response.competitors || [];
  for (let i = 1; i <= 5; i++) {
    const competitor = competitors[i - 1];
    if (competitor) {
      flattened[`competitor_${i}_id`] = competitor.id || "";
      flattened[`competitor_${i}_name`] = competitor.name || "";
      flattened[`competitor_${i}_present`] = competitor.present || "";
      flattened[`competitor_${i}_position`] = competitor.position || "";
      flattened[`competitor_${i}_sentiment`] = competitor.sentiment || "";
    } else {
      flattened[`competitor_${i}_id`] = "";
      flattened[`competitor_${i}_name`] = "";
      flattened[`competitor_${i}_present`] = "";
      flattened[`competitor_${i}_position`] = "";
      flattened[`competitor_${i}_sentiment`] = "";
    }
  }

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
    const { apiKey, brandId, startDate, endDate, fetchAll = false, endpoint = 'responses', fields = [] }: RequestBody = await req.json();

    if (!apiKey || !brandId || !startDate || !endDate) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (endpoint === 'query') {
      if (fields.length === 0) {
        return new Response(
          JSON.stringify({ error: "Fields parameter is required for query endpoint" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const allItems: Record<string, unknown>[] = [];
      let currentOffset = 0;
      const pageLimit = 50000;
      const maxResults = fetchAll ? Infinity : 50000;

      while (allItems.length < maxResults) {
        const url = new URL(`https://api.scrunchai.com/v1/${brandId}/query`);
        url.searchParams.append("start_date", startDate);
        url.searchParams.append("end_date", endDate);
        url.searchParams.append("fields", fields.join(","));
        url.searchParams.append("limit", pageLimit.toString());
        url.searchParams.append("offset", currentOffset.toString());

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

        if (items.length === 0) {
          console.warn(`Query endpoint returned 0 rows. URL: ${url.toString()}\nUpstream response shape:`, data);
          break;
        }

        for (const item of items) {
          if (allItems.length >= maxResults) break;
          allItems.push(item);
        }

        if (items.length < pageLimit) {
          break;
        }

        currentOffset += pageLimit;
      }

      return new Response(JSON.stringify({ items: allItems, total: allItems.length }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      const allItems: Record<string, unknown>[] = [];
      let currentOffset = 0;
      const pageLimit = 100;
      const maxResponses = fetchAll ? Infinity : 1000;

      while (allItems.length < maxResponses) {
        const url = new URL(`https://api.scrunchai.com/v1/${brandId}/responses`);
        url.searchParams.append("start_date", startDate);
        url.searchParams.append("end_date", endDate);
        url.searchParams.append("limit", pageLimit.toString());
        url.searchParams.append("offset", currentOffset.toString());

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

        if (items.length === 0) {
          console.warn(`Responses endpoint returned 0 rows. URL: ${url.toString()}\nUpstream response shape:`, data);
          break;
        }

        for (const item of items) {
          if (allItems.length >= maxResponses) break;
          allItems.push(flattenResponse(item as Response));
        }

        if (items.length < pageLimit) {
          break;
        }

        currentOffset += pageLimit;
      }

      return new Response(JSON.stringify({ items: allItems, total: allItems.length }), {
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
