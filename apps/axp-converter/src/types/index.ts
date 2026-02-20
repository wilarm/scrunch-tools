export interface UploadedFile {
  name: string;
  rawText: string;
}

export interface ProcessedFile {
  name: string;
  rawText: string;
  convertedMarkdown: string;
  finalMarkdown: string;
}

export interface LinkPoolEntry {
  url: string;
  contextSnippet: string;
  sourceFile: string;
}

export type AppState = 'idle' | 'converting' | 'linking' | 'done' | 'error';
