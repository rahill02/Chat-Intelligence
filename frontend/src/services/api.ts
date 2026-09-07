import axios from 'axios';
import type {
  HealthStatus,
  SearchRequest,
  SearchResponse,
  AnswerRequest,
  AnswerResponse,
  MessageWithContext,
  SummaryRequest,
  SummaryResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const checkHealth = async (): Promise<HealthStatus> => {
  const response = await api.get<HealthStatus>('/health');
  return response.data;
};

export const searchMessages = async (request: SearchRequest): Promise<SearchResponse> => {
  const response = await api.post<SearchResponse>('/search', request);
  return response.data;
};

export const getAnswer = async (request: AnswerRequest): Promise<AnswerResponse> => {
  const response = await api.post<AnswerResponse>('/answer', request);
  return response.data;
};

export const getMessageContext = async (
  messageId: string,
  window: number = 3
): Promise<MessageWithContext> => {
  const response = await api.get<MessageWithContext>(`/messages/${messageId}/context`, {
    params: { window },
  });
  return response.data;
};

export const getSummary = async (request: SummaryRequest): Promise<SummaryResponse> => {
  const response = await api.post<SummaryResponse>('/summarize', request);
  return response.data;
};

export const getSuggestedTopics = async (): Promise<string[]> => {
  const response = await api.get<string[]>('/topics');
  return response.data;
};

export default api;

