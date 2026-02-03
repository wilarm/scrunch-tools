export interface FormState {
  apiKey: string;
  brandId: string;
  brandName: string;
  startDate: string;
  endDate: string;
  templateId: string;
  metrics: string[];
  slideName: string;
  sheetsTemplateId?: string; // Optional: Pre-styled Google Sheets template ID for charts
  // Optional filters
  tag?: string;
  aiPlatform?: string;
  branded?: string;
  promptTopic?: string;
}

export interface Brand {
  id: number;
  name: string;
  website: string;
}

export interface QueryResult {
  responses?: number;
  brand_presence_percentage?: number;
  brand_position_score?: number;
  brand_sentiment_score?: number;
  competitor_presence_percentage?: number;
  competitor_position_score?: number;
  competitor_sentiment_score?: number;
}

export interface TemplateInfo {
  placeholders: string[];
  slideCount: number;
}

export interface SlideGenerationResult {
  deckId: string;
  link: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
}

export type GenerationStep = 'idle' | 'authenticating' | 'fetching' | 'creating' | 'done' | 'error';

export interface ChartData {
  label: string;
  value: number;
}

export interface DonutChartConfig {
  title: string;
  data: ChartData[];
  sheetName: string;
  slideObjectId?: string;  // Which slide to place the chart on
  position?: {
    x: number;  // Position in inches
    y: number;
    width: number;
    height: number;
  };
}
