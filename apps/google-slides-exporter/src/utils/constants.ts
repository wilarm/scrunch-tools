// Default Scrunch template ID
// To set this up:
// 1. Create or use an existing Google Slides template with placeholder variables
// 2. Share it with "Anyone with the link" (View access)
// 3. Extract the ID from the URL: https://docs.google.com/presentation/d/TEMPLATE_ID_HERE/edit
// 4. Replace the value below
export const DEFAULT_TEMPLATE_ID = '1_XI8KsN4NPiaKBEGsnU0Gcbk1Wf9WSNsGj9_rkVV3LY';

// Available placeholder variables that can be used in templates
export const AVAILABLE_PLACEHOLDERS = [
  { key: '{{brand_name}}', description: 'Brand identifier' },
  { key: '{{brand_id}}', description: 'Brand ID' },
  { key: '{{date_range}}', description: 'Full date range (e.g., "2024-01-01 to 2024-01-31")' },
  { key: '{{start_date}}', description: 'Start date' },
  { key: '{{end_date}}', description: 'End date' },
  { key: '{{total_responses}}', description: 'Total response count' },
  { key: '{{presence_pct}}', description: 'Brand presence percentage' },
  { key: '{{position_score}}', description: 'Brand position score' },
  { key: '{{sentiment_score}}', description: 'Brand sentiment score' },
  { key: '{{competitor_presence_pct}}', description: 'Competitor presence percentage' },
  { key: '{{competitor_position_score}}', description: 'Competitor position score' },
  { key: '{{competitor_sentiment_score}}', description: 'Competitor sentiment score' },
] as const;
