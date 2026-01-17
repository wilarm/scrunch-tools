export interface Persona {
  name: string;
  description: string;
}

export interface Competitor {
  name: string;
  alternative_names: string[];
  websites: string[];
  confidence?: number;
}

export interface PrimaryLocation {
  city: string;
  region: string;
  country: string;
  confidence: number;
}

export interface Brand {
  website: string;
  name: string;
  alternative_names: string[];
  alternative_websites: string[];
  description: string;
  personas: Persona[];
  key_topics: string[];
  competitors: Competitor[];
}

export interface TemplateConfig {
  descriptionTemplate: string;
  personasTemplate: Persona[];
  keyTopics: string[];
}

export type SubmissionStatus = 'pending' | 'loading' | 'success' | 'error';

export type EnrichmentStatus = 'not_enriched' | 'enriching' | 'enriched' | 'enrich_error';

export interface EnrichmentResult {
  website: string;
  name: string;
  alternative_names: string[];
  primary_location: PrimaryLocation;
  competitors: Competitor[];
  evidence: {
    name_sources: string[];
    location_sources: string[];
    competitor_sources: string[];
  };
}

export interface BrandSubmissionState extends Brand {
  id: string;
  status: SubmissionStatus;
  errorMessage?: string;
  enrichmentStatus: EnrichmentStatus;
  enrichmentError?: string;
  primaryLocation?: PrimaryLocation;
  userEditedFields: Set<string>;
  brandApiId?: number;
}

export type PromptStage = 'Advice' | 'Awareness' | 'Evaluation' | 'Comparison' | 'Other';

export type PromptPlatform =
  | 'chatgpt'
  | 'claude'
  | 'google_ai_overviews'
  | 'perplexity'
  | 'meta'
  | 'google_ai_mode'
  | 'google_gemini'
  | 'copilot';

export interface PromptInput {
  text: string;
  stage?: PromptStage;
  platforms: PromptPlatform[];
  tags?: string[];
  persona_id?: number | null;
}

export interface PromptSubmissionState {
  id: string;
  text: string;
  status: SubmissionStatus;
  errorMessage?: string;
}

export interface PromptBulkSubmission {
  brandIds: number[];
  prompts: string[];
  stage: PromptStage;
  platforms: PromptPlatform[];
}
