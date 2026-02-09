import { listBrands, BrandListing, SUPABASE_FUNCTIONS_URL } from '../lib/scrunchApi';
import { PromptVariant } from '../components/PromptPreviewTable';
import { replacePromptVariables } from './promptParser';

export interface PromptEnrichmentProgress {
  brandId: number;
  name?: string;
  primaryLocation?: string;
  confidence?: number;
  error?: string;
  status?: 'loading' | 'success' | 'error';
}

export interface BatchEnrichmentResult {
  brandId: number;
  name: string;
  primaryLocation: string;
}

export async function enrichPromptVariants(
  apiKey: string,
  variants: PromptVariant[],
  onProgress: (progress: PromptEnrichmentProgress) => void
): Promise<BatchEnrichmentResult[]> {
  const uniqueBrandIds = Array.from(new Set(variants.map(v => v.brandId)));

  console.log('Fetching brands from Scrunch API...');
  let brandsResponse;
  try {
    brandsResponse = await listBrands(apiKey);
    console.log(`Successfully fetched ${brandsResponse.items.length} brands from API`);
  } catch (error) {
    console.error('Failed to fetch brands:', error);
    throw new Error(
      `Failed to fetch brands from API: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  const brandMap = new Map<number, BrandListing>();
  for (const brand of brandsResponse.items) {
    brandMap.set(brand.id, brand);
  }

  // Collect brands to enrich
  const brandsToEnrich: { brandId: number; name: string; website: string }[] = [];
  for (const brandId of uniqueBrandIds) {
    const brand = brandMap.get(brandId);
    if (!brand) {
      onProgress({
        brandId,
        status: 'error',
        error: `Brand ID ${brandId} not found in your organization`,
      });
      continue;
    }
    brandsToEnrich.push({ brandId, name: brand.name, website: brand.website });
  }

  if (brandsToEnrich.length === 0) {
    return [];
  }

  // Set all brands to loading
  for (const b of brandsToEnrich) {
    onProgress({ brandId: b.brandId, status: 'loading', name: b.name });
  }

  // Single batch API call
  console.log(`Batch enriching ${brandsToEnrich.length} brands...`);
  try {
    const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/enrich-batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brands: brandsToEnrich.map(b => ({ name: b.name, website: b.website })),
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    const { results } = await response.json();
    console.log(`Batch enrichment returned ${results.length} results`);

    // Map results back to brandIds by matching order (results match input order)
    const enrichmentResults: BatchEnrichmentResult[] = [];
    for (let i = 0; i < brandsToEnrich.length; i++) {
      const brand = brandsToEnrich[i];
      const result = results[i];

      if (result?.primary_location) {
        onProgress({
          brandId: brand.brandId,
          status: 'success',
          name: brand.name,
          primaryLocation: result.primary_location,
        });
        enrichmentResults.push({
          brandId: brand.brandId,
          name: brand.name,
          primaryLocation: result.primary_location,
        });
      } else {
        onProgress({
          brandId: brand.brandId,
          status: 'error',
          error: 'No location returned',
        });
      }
    }

    console.log('Batch enrichment complete');
    return enrichmentResults;
  } catch (error) {
    console.error('Batch enrichment failed:', error);
    // Mark all brands as errored
    for (const b of brandsToEnrich) {
      onProgress({
        brandId: b.brandId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    throw error;
  }
}

export function updateVariantsWithEnrichment(
  variants: PromptVariant[],
  brandId: number,
  status?: 'loading' | 'success' | 'error',
  name?: string,
  primaryLocation?: string,
  customVariables?: Record<string, string>,
  error?: string,
  confidence?: number
): PromptVariant[] {
  return variants.map(variant => {
    if (variant.brandId !== brandId) return variant;

    // If just setting loading state, don't update the prompt yet
    if (status === 'loading') {
      return {
        ...variant,
        brandName: name || variant.brandName,
        enrichmentStatus: 'loading' as const,
      };
    }

    // If error occurred, keep existing state
    if (status === 'error') {
      return {
        ...variant,
        errorMessage: error,
        enrichmentStatus: 'error' as const,
      };
    }

    // Success: update the prompt with enriched data
    // Use manual overrides if provided, otherwise use enriched values
    const updatedName = variant.manualBrandName || name || variant.brandName;
    const updatedLocation = variant.manualPrimaryLocation || primaryLocation;

    const processedPrompt = replacePromptVariables(
      variant.seedPrompt,
      updatedName,
      updatedLocation,
      customVariables
    );

    return {
      ...variant,
      brandName: updatedName,
      processedPrompt,
      enrichmentStatus: 'enriched' as const,
      enrichmentConfidence: confidence ? confidence * 10 : undefined, // Convert 0-1 to 0-10
    };
  });
}
