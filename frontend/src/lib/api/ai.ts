import { api } from '../api';

export interface ChatRequest {
  message: string;
  model?: string;
  messageHistory: Array<{
    role: string;
    content: string;
  }>;
}

export interface PlanRequest {
  goal: string;
  area: string;
  timeframe?: string;
}

export const aiApi = {
  async chat(request: ChatRequest) {
    const response = await api.post('/ai/chat', request);
    if (!response.ok) {
      throw new Error('Error en la comunicación con IA');
    }
    return response.json();
  },

  async generatePlan(request: PlanRequest) {
    const response = await api.post('/ai/generate-plan', request);
    if (!response.ok) {
      throw new Error('Error generando plan');
    }
    return response.json();
  }
}; 