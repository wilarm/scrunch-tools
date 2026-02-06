import { Brand, PromptInput } from '../types/brand';
import { SUPABASE_FUNCTIONS_URL } from '../lib/scrunchApi';

type CreateBrandPayload = {
  name: string;
  website: string;
  description: string;
  alternative_names: string[];
  alternative_websites: string[];
  competitors: Array<{
    name: string;
    alternative_names?: string[];
    websites?: string[];
  }>;
  personas: Array<{
    name: string;
    description: string;
  }>;
  key_topics: string[];
};

export async function createBrand(apiKey: string, brand: Brand): Promise<{ id: number }> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API key is required');
  }

  if (!brand.name || !brand.name.trim()) {
    throw new Error('Brand name is required');
  }

  if (!brand.website || !brand.website.trim()) {
    throw new Error('Website is required');
  }

  if (!brand.description || !brand.description.trim()) {
    throw new Error('Description is required');
  }

  try {
    new URL(brand.website);
  } catch {
    throw new Error('Website must be a valid URL');
  }

  const payload: CreateBrandPayload = {
    name: brand.name,
    website: brand.website,
    description: brand.description,
    alternative_names: brand.alternative_names ?? [],
    alternative_websites: brand.alternative_websites ?? [],
    competitors: (brand.competitors ?? []).map((c) => ({
      name: c.name,
      alternative_names: c.alternative_names ?? [],
      websites: c.websites ?? [],
    })),
    personas: (brand.personas ?? []).map((p) => ({
      name: p.name,
      description: p.description,
    })),
    key_topics: brand.key_topics ?? [],
  };

  const proxyUrl = `${SUPABASE_FUNCTIONS_URL}/create-brand`;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey, payload }),
  });

  const responseText = await response.text().catch(() => '');
  let responseData: any;
  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch {
    responseData = { error: responseText || 'Invalid response from server' };
  }

  if (!response.ok) {
    const errorMessage = responseData.error || responseData.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return responseData as { id: number };
}

export async function createPrompt(
  apiKey: string,
  brandId: number,
  prompt: PromptInput
): Promise<{ id: number }> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('API key is required');
  }

  if (!brandId) {
    throw new Error('Brand ID is required');
  }

  if (!prompt.text || !prompt.text.trim()) {
    throw new Error('Prompt text is required');
  }

  if (!prompt.platforms || prompt.platforms.length === 0) {
    throw new Error('At least one platform is required');
  }

  const proxyUrl = `${SUPABASE_FUNCTIONS_URL}/create-prompt`;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ apiKey, brandId, payload: prompt }),
  });

  const responseText = await response.text().catch(() => '');
  let responseData: any;
  try {
    responseData = responseText ? JSON.parse(responseText) : {};
  } catch {
    responseData = { error: responseText || 'Invalid response from server' };
  }

  if (!response.ok) {
    const errorMessage = responseData.error || responseData.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(errorMessage);
  }

  return responseData as { id: number };
}
