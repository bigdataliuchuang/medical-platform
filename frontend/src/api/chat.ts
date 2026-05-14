import axios from 'axios';

const aiClient = axios.create({
  baseURL: import.meta.env.VITE_AGENT_API_URL || 'http://localhost:8001',
  timeout: 60000,
});

export interface ChatResponse {
  answer: string;
  sql: string;
  data: Record<string, any>[];
  row_count: number;
  status: string;
  session_id: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  data?: Record<string, any>[];
}

export async function sendChat(sessionId: string, message: string, userId = 'admin'): Promise<ChatResponse> {
  const res = await aiClient.post<ChatResponse>('/api/chat', {
    session_id: sessionId,
    message,
    user_id: userId,
  });
  return res.data;
}

export async function getSuggestions(count = 4): Promise<string[]> {
  const res = await aiClient.get<{ suggestions: string[] }>('/api/chat/suggestions', { params: { count } });
  return res.data.suggestions;
}
