const API_BASE_URL = 'http://localhost:3001/api';

export const apiClient = {
  async getAllQuestions() {
    const response = await fetch(`${API_BASE_URL}/questions/all`);
    return response.json();
  },

  async getPendingQuestions() {
    const response = await fetch(`${API_BASE_URL}/questions/pending`);
    return response.json();
  },

  async getAnsweredQuestions() {
    const response = await fetch(`${API_BASE_URL}/questions/answered`);
    return response.json();
  },

  async getQuestions(params = {}) {
    const queryParams = new URLSearchParams(params as any);
    const response = await fetch(`${API_BASE_URL}/questions?${queryParams}`);
    return response.json();
  },

  async getQuestion(id: string) {
    const response = await fetch(`${API_BASE_URL}/questions/${id}`);
    return response.json();
  },

  async submitQuestion(data: any) {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getValidations(params = {}) {
    const queryParams = new URLSearchParams(params as any);
    const response = await fetch(`${API_BASE_URL}/validations?${queryParams}`);
    return response.json();
  },

  async submitVote(validationId: string, data: any) {
    const response = await fetch(`${API_BASE_URL}/validations/${validationId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getOracleStats() {
    const response = await fetch(`${API_BASE_URL}/oracle/stats`);
    return response.json();
  },

  async getOracleFees() {
    const response = await fetch(`${API_BASE_URL}/oracle/fees`);
    return response.json();
  },
};
