import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// Helper to extract items from various response formats
function extractItems(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === 'object') {
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.results)) return data.results;
  }
  return [];
}

// Flatten response data
function flattenResponse(response) {
  const flat = { ...response };

  if (response.citations && Array.isArray(response.citations)) {
    flat.citations = response.citations.map(c => c.url || c).join('; ');
  }

  if (response.competitors && Array.isArray(response.competitors)) {
    flat.competitors = response.competitors.map(c => c.name || c).join('; ');
  }

  return flat;
}

// Main proxy endpoint
app.post('/api/scrunch-proxy', async (req, res) => {
  try {
    const {
      apiKey,
      brandId,
      startDate,
      endDate,
      limit = 100,
      offset = 0,
      fetchAll = false,
      endpoint = 'responses',
      fields = [],
    } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    if (!brandId) {
      return res.status(400).json({ error: 'Brand ID is required' });
    }

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Handle query endpoint
    if (endpoint === 'query') {
      if (!fields || fields.length === 0) {
        return res.status(400).json({ error: 'Query endpoint requires fields parameter' });
      }

      const allItems = [];
      let currentOffset = 0;
      const pageLimit = 100;
      const maxResults = fetchAll ? 10000 : 1000;

      while (allItems.length < maxResults) {
        const url = new URL(`https://api.scrunchai.com/v1/${brandId}/query`);
        url.searchParams.append('start_date', startDate);
        url.searchParams.append('end_date', endDate);
        url.searchParams.append('fields', fields.join(','));
        url.searchParams.append('limit', pageLimit.toString());
        url.searchParams.append('offset', currentOffset.toString());

        console.log(`Fetching query: ${url.toString()}`);

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          return res.status(response.status).json({
            error: `Scrunch API error: ${response.status} ${response.statusText}`,
            details: errorText,
          });
        }

        const data = await response.json();

        if (typeof data === 'object' && data !== null && 'error' in data && data.error) {
          return res.status(400).json({
            error: `Scrunch API error: ${data.error}`,
          });
        }

        const items = extractItems(data);

        if (items.length === 0) {
          console.warn(`Query endpoint returned 0 rows. Stopping pagination.`);
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

      return res.json({ items: allItems, total: allItems.length });
    }

    // Handle responses endpoint
    const allItems = [];
    let currentOffset = 0;
    const pageLimit = 100;
    const maxResponses = fetchAll ? 10000 : 1000;

    while (allItems.length < maxResponses) {
      const url = new URL(`https://api.scrunchai.com/v1/${brandId}/responses`);
      url.searchParams.append('start_date', startDate);
      url.searchParams.append('end_date', endDate);
      url.searchParams.append('limit', pageLimit.toString());
      url.searchParams.append('offset', currentOffset.toString());

      if (fields && fields.length > 0) {
        url.searchParams.append('fields', fields.join(','));
      }

      console.log(`Fetching responses: ${url.toString()}`);

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        return res.status(response.status).json({
          error: `Scrunch API error: ${response.status} ${response.statusText}`,
          details: errorText,
        });
      }

      const data = await response.json();

      if (typeof data === 'object' && data !== null && 'error' in data && data.error) {
        return res.status(400).json({
          error: `Scrunch API error: ${data.error}`,
        });
      }

      const items = extractItems(data);

      if (items.length === 0) {
        console.warn(`Responses endpoint returned 0 rows. Stopping pagination.`);
        break;
      }

      for (const item of items) {
        if (allItems.length >= maxResponses) break;
        allItems.push(flattenResponse(item));
      }

      if (items.length < pageLimit) {
        break;
      }

      currentOffset += pageLimit;
    }

    return res.json({ items: allItems, total: allItems.length });
  } catch (error) {
    console.error('Proxy error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Scrunch API Export proxy server running on http://localhost:${PORT}`);
});
