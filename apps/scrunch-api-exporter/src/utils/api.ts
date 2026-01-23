export const DEFAULT_LIMIT = 1000;
const MAX_ROWS = 200000;

const QUERY_METRICS = [
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

interface ExportParams {
  apiKey: string;
  brandId: string;
  startDate: string;
  endDate: string;
  fetchAll?: boolean;
  endpoint?: 'responses' | 'query';
  fields?: string[];
  onProgress?: (loaded: number, total: number) => void;
}

type AnyApiResponse =
  | Record<string, unknown>[]
  | { items: Record<string, unknown>[]; total?: number }
  | { data: Record<string, unknown>[]; total?: number }
  | { results: Record<string, unknown>[]; total?: number };

function extractRows(json: AnyApiResponse): Record<string, unknown>[] {
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

export function validateQueryFields(fields: string[]): { valid: boolean; error?: string } {
  if (fields.length === 0) {
    return { valid: false, error: 'Query exports must include at least one metric.' };
  }

  const hasMetric = fields.some(f => QUERY_METRICS.includes(f));
  if (!hasMetric) {
    return { valid: false, error: 'Query exports must include at least one metric.' };
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

export async function fetchAndFlattenData(params: ExportParams): Promise<Record<string, unknown>[]> {
  const { apiKey, brandId, startDate, endDate, fetchAll = false, endpoint = 'responses', fields = [], onProgress } = params;

  // Use local proxy server instead of Supabase
  const proxyUrl = 'http://localhost:3002/api/scrunch-proxy';

  const allItems: Record<string, unknown>[] = [];
  let offset = 0;
  let pageSize = DEFAULT_LIMIT;

  try {
    onProgress?.(0, MAX_ROWS);

    while (true) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
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
            endpoint,
            fields,
            fetchAll,
            limit: pageSize,
            offset,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(errorData.error || `Export failed with status ${response.status}`);
        }

        const json: AnyApiResponse = await response.json();
        const items = extractRows(json);

        if (items.length === 0) {
          console.warn('API returned 0 rows. Raw response:', json);
          break;
        }

        allItems.push(...items);
        onProgress?.(allItems.length, MAX_ROWS);

        if (allItems.length >= MAX_ROWS) {
          throw new Error(`Exceeded maximum of ${MAX_ROWS} rows. Please reduce your date range or select fewer fields.`);
        }

        if (!fetchAll || items.length < pageSize) {
          break;
        }

        offset += pageSize;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('Request timeout - try reducing date range or fields');
        }
        throw error;
      }
    }

    return allItems;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred');
  }
}

const FIELD_ORDER = [
  'id',
  'created_at',
  'platform',
  'country',
  'prompt_id',
  'prompt',
  'response_text',
  'stage',
  'branded',
  'persona_id',
  'persona_name',
  'tags',
  'key_topics',
  'brand_present',
  'brand_sentiment',
  'brand_position',
  'competitors_present',
  'competitor_1_id',
  'competitor_1_name',
  'competitor_1_present',
  'competitor_1_position',
  'competitor_1_sentiment',
  'competitor_2_id',
  'competitor_2_name',
  'competitor_2_present',
  'competitor_2_position',
  'competitor_2_sentiment',
  'competitor_3_id',
  'competitor_3_name',
  'competitor_3_present',
  'competitor_3_position',
  'competitor_3_sentiment',
  'competitor_4_id',
  'competitor_4_name',
  'competitor_4_present',
  'competitor_4_position',
  'competitor_4_sentiment',
  'competitor_5_id',
  'competitor_5_name',
  'competitor_5_present',
  'competitor_5_position',
  'competitor_5_sentiment',
  'citation_1_domain',
  'citation_1_source_type',
  'citation_1_title',
  'citation_1_url',
  'citation_2_domain',
  'citation_2_source_type',
  'citation_2_title',
  'citation_2_url',
  'citation_3_domain',
  'citation_3_source_type',
  'citation_3_title',
  'citation_3_url',
  'citation_4_domain',
  'citation_4_source_type',
  'citation_4_title',
  'citation_4_url',
  'citation_5_domain',
  'citation_5_source_type',
  'citation_5_title',
  'citation_5_url',
];

function escapeCSVValue(value: unknown): string {
  const str = String(value || '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function generateCSV(data: Record<string, unknown>[], selectedColumns?: string[]): string {
  if (data.length === 0) {
    return '';
  }

  let columns: string[];

  if (selectedColumns && selectedColumns.length > 0) {
    columns = selectedColumns;
  } else {
    const inferredColumns = Object.keys(data[0] || {});
    columns = inferredColumns.length > 0 ? inferredColumns : FIELD_ORDER;
  }

  const csvRows: string[] = [];
  csvRows.push(columns.map(escapeCSVValue).join(','));

  for (const item of data) {
    const row = columns.map(field => escapeCSVValue(item[field]));
    csvRows.push(row.join(','));
  }

  return csvRows.join('\n');
}

export const AVAILABLE_COLUMNS = FIELD_ORDER;
