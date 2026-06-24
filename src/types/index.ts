export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface Chat {
  id: string;
  name: string;
  mode: 'gaokao' | 'fun';
  messages: ChatMessage[];
}

export interface ApiConfig {
  url: string;
  key: string;
  model: string;
  tavily: string;
}

export interface ExtractedInfo {
  province: string;
  rank: number;
  score: number;
  majors: string[];
  schools: string[];
  keywords: string[];
}

export interface ServiceProvider {
  name: string;
  url: string;
  keyUrl?: string;
  models: ModelInfo[];
}

export interface ModelInfo {
  id: string;
  name: string;
  description?: string;
}