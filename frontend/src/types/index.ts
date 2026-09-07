export interface HealthStatus {
  status: string;
  project: string;
  version: string;
  environment: string;
  timestamp: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sequence_num: number;
  sender_name: string;
  sender_id: string;
  content: string;
  timestamp: string;
  reply_to_id?: string | null;
  is_code_mixed?: boolean;
  language?: string;
  metadata?: Record<string, unknown> | null;
}

export interface MessageWithContext {
  target_message: Message;
  before: Message[];
  after: Message[];
}

export interface ScoreBreakdown {
  semantic_score: number;
  sender_boost: number;
  temporal_boost: number;
  keyword_boost: number;
  final_score: number;
}

export interface SearchResultItem {
  message: Message;
  similarity_score: number;
  final_score: number;
  rank: number;
  score_breakdown: ScoreBreakdown;
  context?: MessageWithContext | null;
  highlights: string[];
}

export interface QueryAnalysis {
  original_query: string;
  cleaned_query: string;
  detected_sender?: string | null;
  detected_date_range?: {
    start: string;
    end: string;
  } | null;
  intent: 'semantic' | 'attributed' | 'temporal' | 'combined';
  confidence: number;
}

export interface SearchRequest {
  query: string;
  conversation_id?: string | null;
  sender?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  top_k?: number;
  min_score?: number;
  include_context?: boolean;
  context_window?: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  total_matches: number;
  latency_ms: number;
  search_type: string;
  query_analysis?: QueryAnalysis | null;
}

export interface Citation {
  message_id: string;
  sender_name: string;
  timestamp: string;
  content_snippet: string;
  sequence_num: number;
}

export interface AnswerRequest {
  query: string;
  conversation_id?: string | null;
  sender?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  top_k?: number;
}

export interface AnswerResponse {
  query: string;
  answer: string;
  confidence: number;
  has_sufficient_evidence: boolean;
  citations: Citation[];
  sources_used: string[];
  search_type: string;
  latency_ms: number;
}
