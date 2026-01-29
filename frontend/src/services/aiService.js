import api from "../libraries/axiosInstance";
import { apiPaths } from "../utils/apiPaths";

export const generateFlashcards = async (documentId, options) => {
  try {
    const res = await api.post(apiPaths.ai.generateFlashcards, {
      documentId,
      ...options,
    });

    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to generate flashcards" };
  }
};

export const generateQuiz = async (documentId, options) => {
  try {
    const res = await api.post(apiPaths.ai.generateQuiz, {
      documentId,
      ...options,
    });

    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to generate quiz" };
  }
};

export const generateSummary = async (documentId) => {
  try {
    const res = await api.post(apiPaths.ai.generateSummary, { documentId });

    return res.data?.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to generate summary" };
  }
};

export const chat = async (documentId, question) => {
  try {
    const res = await api.post(apiPaths.ai.chat, { documentId, question });

    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to send text message" };
  }
};

export const explainConcept = async (documentId, concept) => {
  try {
    const res = await api.post(apiPaths.ai.explainConcept, {
      documentId,
      concept,
    });

    return res.data?.data;
  } catch (error) {
    throw error.response?.data || { error: "Error generating explanation" };
  }
};

export const getChatHistory = async (documentId) => {
  try {
    const res = await api.get(apiPaths.ai.getChatHistory(documentId));
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch chat history" };
  }
};
