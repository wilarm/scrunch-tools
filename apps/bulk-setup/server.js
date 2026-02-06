import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

// Prevent the server from crashing on unhandled errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Proxy endpoint for listing brands
app.post('/api/scrunch/brands', async (req, res) => {
  const { apiKey, limit = 1000, offset = 0 } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    const url = `https://api.scrunchai.com/v1/brands?limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for creating a brand
app.post('/api/scrunch/create-brand', async (req, res) => {
  const { apiKey, payload } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  try {
    const url = 'https://api.scrunchai.com/v1/brands';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for creating a prompt
app.post('/api/scrunch/create-prompt', async (req, res) => {
  const { apiKey, brandId, payload } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: 'API key is required' });
  }

  if (!brandId) {
    return res.status(400).json({ error: 'Brand ID is required' });
  }

  try {
    const url = `https://api.scrunchai.com/v1/${brandId}/prompts`;
    console.log(`POST to Scrunch: ${url}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      data = { error: responseText || 'Empty or invalid JSON response from upstream' };
    }

    if (!response.ok) {
      console.error(`Upstream error ${response.status}:`, data);
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Proxy endpoint for enriching websites using OpenAI
app.post('/api/scrunch/enrich', async (req, res) => {
  const { website, brandName } = req.body;

  if (!website) {
    return res.status(400).json({ error: 'Website is required' });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }

  try {
    const openai = new OpenAI({ apiKey: openaiKey });

    const systemPrompt = `You are a precise business research assistant. Your task is to research brands and return structured data about them.

Return only valid JSON in this exact format:
{
  "name": "Official Brand Name",
  "alternative_names": ["Alt Name 1", "Alt Name 2"],
  "primary_location": {
    "city": "San Francisco",
    "region": "CA",
    "country": "US",
    "confidence": 0.95
  },
  "competitors": [
    {
      "name": "Competitor Name",
      "websites": ["https://competitor.com"],
      "confidence": 0.8
    }
  ]
}

Format requirements:
- name: The official/common brand name
- alternative_names: Other names the brand is known by (abbreviations, former names, etc.). Can be empty array.
- primary_location: Where the main corporate office is located
  - region: 2-letter state code for US (e.g., "CA"), province/region for international
  - country: 2-letter country code (e.g., "US", "UK", "AU")
  - confidence: 0 to 1 based on quality of information
- competitors: 3-5 direct competitors in the same industry
  - websites: The competitor's main website URL
  - confidence: 0 to 1 for how direct a competitor they are
- Prioritize official company information`;

    const userMessage = brandName
      ? `Research the brand "${brandName}" (website: ${website}). Return their official name, alternative names, headquarters location, and top competitors.`
      : `Research the company at ${website}. Return their official name, alternative names, headquarters location, and top competitors.`;

    const response = await openai.responses.create({
      model: 'gpt-5',
      tools: [{ type: 'web_search' }],
      input: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    });

    const content = response.output_text;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(content);
    res.json(result);
  } catch (error) {
    console.error('Enrichment error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
