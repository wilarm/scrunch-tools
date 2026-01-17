import { EnrichmentResult } from '../types/brand';

export async function enrichWebsite(
  website: string
): Promise<EnrichmentResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const response = await fetch(`${supabaseUrl}/functions/v1/enrich`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
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
