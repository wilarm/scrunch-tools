import { EnrichmentResult } from '../types/brand';
import { SUPABASE_FUNCTIONS_URL } from '../lib/scrunchApi';

export async function enrichWebsite(
  website: string
): Promise<EnrichmentResult> {
  const proxyUrl = `${SUPABASE_FUNCTIONS_URL}/enrich`;

  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ website }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export async function enrichWebsitesWithConcurrency(
  websites: string[],
  concurrency: number,
  onProgress: (website: string, result: EnrichmentResult | null, error: string | null) => void
): Promise<void> {
  const queue = [...websites];
  const inProgress = new Set<Promise<void>>();

  while (queue.length > 0 || inProgress.size > 0) {
    while (inProgress.size < concurrency && queue.length > 0) {
      const website = queue.shift()!;

      const promise = enrichWebsite(website)
        .then((result) => {
          onProgress(website, result, null);
        })
        .catch((error) => {
          onProgress(website, null, error instanceof Error ? error.message : 'Unknown error');
        })
        .finally(() => {
          inProgress.delete(promise);
        });

      inProgress.add(promise);
    }

    if (inProgress.size > 0) {
      await Promise.race(inProgress);
    }
  }
}
