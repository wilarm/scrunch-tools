import { listBrands, BrandListing } from '../lib/scrunchApi';
import { enrichWebsite } from './enrichment';
import { PromptVariant } from '../components/PromptPreviewTable';
import { replacePromptVariables } from './promptParser';

export interface PromptEnrichmentProgress {
  brandId: number;
  name?: string;
  primaryLocation?: string;
  error?: string;
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
        error: `Brand ID ${brandId} not found in your organization`,
      });
      continue;
    }

    console.log(`Enriching brand ${brandId} (${brand.name}) from website: ${brand.website}`);
    try {
      const enrichmentResult = await enrichWebsite(brand.website);
      console.log(`Successfully enriched brand ${brandId}`);

      onProgress({
        brandId,
        name: enrichmentResult.name,
        primaryLocation: enrichmentResult.primary_location,
      });
    } catch (error) {
      console.error(`Failed to enrich brand ${brandId}:`, error);
      onProgress({
        brandId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  console.log('Enrichment complete');
}

export function updateVariantsWithEnrichment(
  variants: PromptVariant[],
  brandId: number,
  name?: string,
  primaryLocation?: string,
  customVariables?: Record<string, string>
): PromptVariant[] {
  return variants.map(variant => {
    if (variant.brandId !== brandId) return variant;

    const updatedName = name || variant.brandName;
    const processedPrompt = replacePromptVariables(
      variant.seedPrompt,
      updatedName,
      primaryLocation,
      customVariables
    );

    return {
      ...variant,
      brandName: updatedName,
      processedPrompt,
    };
  });
}
