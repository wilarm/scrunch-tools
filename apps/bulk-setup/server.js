import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

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

    const systemPrompt = `You are a precise business research assistant. Your task is to identify the primary headquarters location of brands.

Return only valid JSON in this exact format:
{
  "primary_location": "City, ST" (US) or "City, Country" (international),
  "confidence": 0.95
}

Format requirements:
- US: "City, ST" using 2-letter state code (e.g., "New York, NY")
- International: "City, Country" (e.g., "London, UK")
- Use the city where the main corporate office is located
- Include a confidence score from 0 to 1 based on the quality and clarity of available information
- Prioritize official company information`;

    const userMessage = brandName
      ? `What is the primary location of ${brandName}? Website: ${website}`
      : `What is the primary location of the company at ${website}?`;

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
