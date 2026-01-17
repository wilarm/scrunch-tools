export const SCRUNCH_API_BASE = import.meta.env.VITE_SCRUNCH_API_BASE_URL || 'https://api.scrunchai.com/v1';

export function getScrunchHeaders(apiKey: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
  };
}

export function scrunchUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SCRUNCH_API_BASE}${cleanPath}`;
}

export async function parseScrunchError(response: Response): Promise<string> {
  const text = await response.text().catch(() => '');
  let parsed: any = null;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    return text || `HTTP ${response.status}: ${response.statusText}`;
  }

  if (parsed?.message) {
    return parsed.message;
  }

  if (Array.isArray(parsed?.detail)) {
    return parsed.detail
      .map((d: any) => d.msg ?? JSON.stringify(d))
      .join('; ');
  }

  if (parsed?.detail) {
    return typeof parsed.detail === 'string' ? parsed.detail : JSON.stringify(parsed.detail);
  }

  return text || `HTTP ${response.status}: ${response.statusText}`;
}

export interface BrandListing {
  id: number;
  name: string;
  website: string;
}

export interface ListBrandsResponse {
  total: number;
  offset: number;
  limit: number | null;
  items: BrandListing[];
}

export async function listBrands(
  apiKey: string,
  limit: number = 1000,
  offset: number = 0
): Promise<ListBrandsResponse> {
  const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-brands`;

  let response: Response;
  try {
    response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        apiKey,
        limit,
        offset,
      }),
    });
  } catch (error) {
    throw new Error(
      `Network error while fetching brands. Please check your internet connection and API configuration. ${error instanceof Error ? error.message : ''}`
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}
