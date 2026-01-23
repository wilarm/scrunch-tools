import { listBrands, BrandListing } from '../lib/scrunchApi';
import { PromptVariant } from '../components/PromptPreviewTable';
import { replacePromptVariables } from './promptParser';

// Simplified enrichment result for prompt enrichment (only returns primary_location as string)
interface PromptEnrichmentResult {
  primary_location: string;
  confidence?: number;
}

export interface PromptEnrichmentProgress {
  brandId: number;
  name?: string;
  primaryLocation?: string;
  confidence?: number;
  error?: string;
  status?: 'loading' | 'success' | 'error';
}

export async function enrichPromptVariants(
  apiKey: string,
  variants: PromptVariant[],
  onProgress: (progress: PromptEnrichmentProgress) => void
): Promise<void> {
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

  console.log(`Processing ${uniqueBrandIds.length} unique brand IDs`);

  for (const brandId of uniqueBrandIds) {
    const brand = brandMap.get(brandId);

    if (!brand) {
      console.warn(`Brand ID ${brandId} not found in organization`);
      onProgress({
        brandId,
        status: 'error',
        error: `Brand ID ${brandId} not found in your organization`,
      });
      continue;
    }

    console.log(`Enriching brand ${brandId} (${brand.name}) from website: ${brand.website}`);

    // Report loading state
    onProgress({
      brandId,
      status: 'loading',
      name: brand.name,
    });

    try {
      // Call the proxy endpoint directly for prompt enrichment
      const proxyUrl = 'http://localhost:3001/api/scrunch/enrich';
      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          website: brand.website,
          brandName: brand.name
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const enrichmentResult: PromptEnrichmentResult = await response.json();
      console.log(`Successfully enriched brand ${brandId}, location: ${enrichmentResult.primary_location}, confidence: ${enrichmentResult.confidence}`);

      onProgress({
        brandId,
        status: 'success',
        name: brand.name, // Use name from API, not from enrichment
        primaryLocation: enrichmentResult.primary_location,
        confidence: enrichmentResult.confidence,
      });
    } catch (error) {
      console.error(`Failed to enrich brand ${brandId}:`, error);
      onProgress({
        brandId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  console.log('Enrichment complete');
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
