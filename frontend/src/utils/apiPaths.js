export const BASE_URL = "http://localhost:8000"

export const apiPaths = {
  auth: {
    register: "/api/auth/register",
    login: "/api/auth/login",
    getProfile: "/api/auth/profile",
    updateProfile: "/api/auth/profile",
    changePassword: "/api/auth/change-password",
  },

  documents: {
    upload: "/api/documents/upload",
    getDocuments: "/api/documents",
    getDocumentById: (id) => `/api/documents/${id}`,
    updateDocument: (id) => `/api/documents/${id}`,
    deleteDocument: (id) => `/api/documents/${id}`,
  },

  ai: {
    generateFlashcards: "/api/ai/generate-flashcards",
    generateQuiz: "/api/ai/generate-quiz",
    generateSummary: "/api/ai/generate-summary",
    chat: "/api/ai/chat",
    explainConcept: "/api/ai/explain-concept",
    getChatHistory: (id) => `/api/ai/chat-history/${id}`,
  },

  flashcards: {
    getAllFlashcardSets: "/api/flashcards",
    getSetsByDocument: (documentId) => `/api/flashcards/${documentId}`,
    reviewFlashcard: (cardId) => `/api/flashcards/${cardId}/review`,
    toggleStar: (cardId) => `/api/flashcards/${cardId}/star`,
    deleteFlashcardSet: (id) => `/api/flashcards/${id}`,
  },

  quizzes: {
    getQuizzesByDocument: (documentId) => `/api/quizzes/${documentId}`,
    getQuizById: (id) => `/api/quizzes/quiz/${id}`,
    submitQuiz: (id) => `/api/quizzes/${id}/submit`,
    getQuizResults: (id) => `/api/quizzes/${id}/results`,
    deleteQuiz: (id) => `/api/quizzes/${id}`,
  },

  progress: {
    getDashboardData: "/api/progress/dashboard",
  },
};
