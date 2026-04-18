const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';

export const api = {
  async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  auth: {
    async googleLogin(credential: string) {
      return api.fetchWithAuth('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ credential }),
      });
    },
  },

  staff: {
    async getStats() {
      return api.fetchWithAuth('/dashboard/stats');
    },
    async getStudents() {
      return api.fetchWithAuth('/students');
    },
    async getCompanies() {
      return api.fetchWithAuth('/companies');
    },
    async createCompany(companyData: any) {
      return api.fetchWithAuth('/companies', {
        method: 'POST',
        body: JSON.stringify(companyData),
      });
    },
    async getAssessments() {
      return api.fetchWithAuth('/assessments');
    },
  },

  student: {
    async getProfile() {
      return api.fetchWithAuth('/student/profile');
    },
    async getDashboard() {
      return api.fetchWithAuth('/student/dashboard');
    },
    async getTests() {
      return api.fetchWithAuth('/student/tests');
    },
    async getAIInsights(studentId: string) {
      return api.fetchWithAuth(`/student/ai-insights/${studentId}`);
    },
    async submitTest(assessmentId: string, studentId: string, answers: any) {
      return api.fetchWithAuth(`/assessments/${assessmentId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ studentId, answers }),
      });
    },
  },
};
