import type { QueryResult, Brand } from '../types';

export const QUERY_METRICS = [
  'responses',
  'brand_presence_percentage',
  'brand_position_score',
  'brand_sentiment_score',
  'competitor_presence_percentage',
  'competitor_position_score',
  'competitor_sentiment_score',
];

const COMPETITOR_METRICS = [
  'competitor_presence_percentage',
  'competitor_position_score',
  'competitor_sentiment_score',
];

const COMPETITOR_DIMENSIONS = [
  'competitor_id',
  'competitor_name',
];

interface FetchParams {
  apiKey: string;
  brandId: string;
  startDate: string;
  endDate: string;
  metrics: string[];
  tag?: string;
  aiPlatform?: string;
  branded?: string;
  promptTopic?: string;
}

type ApiResponse =
  | Record<string, unknown>[]
  | { items: Record<string, unknown>[]; total?: number }
  | { data: Record<string, unknown>[]; total?: number }
  | { results: Record<string, unknown>[]; total?: number };

function extractRows(json: ApiResponse): Record<string, unknown>[] {
  if (Array.isArray(json)) {
    return json;
  }

  if ('items' in json && Array.isArray(json.items)) {
    return json.items;
  }

  if ('data' in json && Array.isArray(json.data)) {
    return json.data;
  }

  if ('results' in json && Array.isArray(json.results)) {
    return json.results;
  }

  return [];
}

export async function fetchBrands(apiKey: string): Promise<Brand[]> {
  // Use Supabase Edge Function proxy
  const proxyUrl = 'https://qnbxemqvfzzgkxchtbhb.supabase.co/functions/v1/scrunch-proxy';

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      endpoint: 'brands',
      fetchAll: false,
      limit: 100,
      offset: 0,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  const json = await response.json();

  // Handle the response format from the API
  if (json.items && Array.isArray(json.items)) {
    return json.items as Brand[];
  }

  if (Array.isArray(json)) {
    return json as Brand[];
  }

  return [];
}

export function validateQueryFields(fields: string[]): { valid: boolean; error?: string } {
  if (fields.length === 0) {
    return { valid: false, error: 'Please select at least one metric.' };
  }

  const selectedCompetitorMetrics = fields.filter(f => COMPETITOR_METRICS.includes(f));
  if (selectedCompetitorMetrics.length > 0) {
    const hasCompetitorDimension = fields.some(f => COMPETITOR_DIMENSIONS.includes(f));
    if (!hasCompetitorDimension) {
      return { valid: false, error: 'Competitor metrics require competitor_id or competitor_name.' };
    }
  }

  return { valid: true };
}

export async function fetchBrandMetrics(params: FetchParams): Promise<QueryResult> {
  const { apiKey, brandId, startDate, endDate, metrics, tag, aiPlatform, branded, promptTopic } = params;

  // Use Supabase Edge Function proxy
  const proxyUrl = 'https://qnbxemqvfzzgkxchtbhb.supabase.co/functions/v1/scrunch-proxy';

  // Build filters object, only including non-empty values
  const filters: Record<string, string | string[]> = {};

  // Handle comma-separated tags
  if (tag && tag.trim()) {
    const tags = tag.split(',').map(t => t.trim()).filter(t => t.length > 0);
    if (tags.length === 1) {
      filters.tag = tags[0];
    } else if (tags.length > 1) {
      filters.tag = tags;
    }
  }

  if (aiPlatform) filters.ai_platform = aiPlatform;
  if (branded) filters.branded = branded;

  // Handle comma-separated prompt topics
  if (promptTopic && promptTopic.trim()) {
    const topics = promptTopic.split(',').map(t => t.trim()).filter(t => t.length > 0);
    if (topics.length === 1) {
      filters.prompt_topic = topics[0];
    } else if (topics.length > 1) {
      filters.prompt_topic = topics;
    }
  }

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      brandId,
      startDate,
      endDate,
      endpoint: 'query',
      fields: metrics,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      fetchAll: false,
      limit: 1,
      offset: 0,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  const json: ApiResponse = await response.json();
  const items = extractRows(json);

  if (items.length === 0) {
    throw new Error('No data found for the specified date range and metrics.');
  }

  return items[0] as QueryResult;
}

export function buildReplacements(
  data: QueryResult,
  params: {
    brandId: string;
    brandName: string;
    startDate: string;
    endDate: string;
  }
): Record<string, string> {
  return {
    '{{brand_name}}': params.brandName,
    '{{brand_id}}': params.brandId,
    '{{date_range}}': `${params.startDate} to ${params.endDate}`,
    '{{start_date}}': params.startDate,
    '{{end_date}}': params.endDate,
    '{{presence_pct}}': formatPercentage(data.brand_presence_percentage),
    '{{total_responses}}': formatNumber(data.responses),
    '{{position_score}}': formatScore(data.brand_position_score),
    '{{sentiment_score}}': formatScore(data.brand_sentiment_score),
    '{{competitor_presence_pct}}': formatPercentage(data.competitor_presence_percentage),
    '{{competitor_position_score}}': formatScore(data.competitor_position_score),
    '{{competitor_sentiment_score}}': formatScore(data.competitor_sentiment_score),
  };
}

function formatPercentage(val?: number): string {
  if (val == null) return 'N/A';
  return `${(val * 100).toFixed(1)}%`;
}

function formatNumber(val?: number): string {
  if (val == null) return 'N/A';
  return val.toLocaleString();
}

function formatScore(val?: number): string {
  if (val == null) return 'N/A';
  return val.toFixed(2);
}
