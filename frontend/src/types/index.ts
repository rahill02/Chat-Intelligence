export interface HealthStatus {
  status: string;
  project: string;
  version: string;
  environment: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  title: string;
  type: 'group' | 'direct';
  participant_count: number;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_name: string;
  sender_id: string;
  content: string;
  timestamp: string;
  is_code_mixed?: boolean;
  language?: string;
  reply_to_id?: string | null;
}

export interface SearchResultItem {
  message: Message;
  score: number;
  semantic_score: number;
  metadata_score: number;
  context: {
    before: Message[];
    after: Message[];
  };
}

export interface SearchResponse {
  query: string;
  answer?: string | null;
  results: SearchResultItem[];
  total_matches: number;
  latency_ms: number;
  query_analysis: {
    detected_sender?: string | null;
    detected_date_range?: { start?: string; end?: string } | null;
    cleaned_query: string;
  };
}
