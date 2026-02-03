// Default Scrunch template ID
// IMPORTANT: This template must be shared "Anyone with the link" (Viewer access)
// See CREATE_DEFAULT_TEMPLATE.md for setup instructions
//
// To set this up:
// 1. Create or use an existing Google Slides template with placeholder variables
// 2. Share it with "Anyone with the link" (View access)
// 3. Extract the ID from the URL: https://docs.google.com/presentation/d/TEMPLATE_ID_HERE/edit
// 4. Replace the value below
//
// TODO: Replace with a valid, publicly accessible template ID
export const DEFAULT_TEMPLATE_ID = '1_XI8KsN4NPiaKBEGsnU0Gcbk1Wf9WSNsGj9_rkVV3LY';

// Default Google Sheets template ID for pre-styled charts
// This template should have 3 sheets: Brand_Sentiment, Brand_Presence, Brand_Position
// Each sheet should have data in A1:B3 format and a pre-styled donut chart
export const DEFAULT_SHEETS_TEMPLATE_ID = '1FwS1-lhiUp3_h4xzgVuiT8kArrWLA6rp5U5l7G6vimI';

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
