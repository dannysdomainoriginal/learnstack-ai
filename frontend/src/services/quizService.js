import api from "../utils/axiosInstance";
import { apiPaths } from "../utils/apiPaths";

export const getAllQuizzes = async () => {
  try {
    const res = await api.get(apiPaths.quizzes.getAllQuizzes);
    return res.data;
  } catch (error) {
    throw (
      error.response?.data || {
        error: "There was an error fetching your quizzes",
      }
    );
  }
};

export const getQuizzesByDocument = async (documentId) => {
  try {
    const res = await api.get(
      apiPaths.quizzes.getQuizzesByDocument(documentId),
    );
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch quizzes" };
  }
};

export const getQuizById = async (id) => {
  try {
    const res = await api.get(apiPaths.quizzes.getQuizById(id));

    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch quiz" };
  }
};

export const submitQuiz = async (quizId, answers) => {
  try {
    const res = await api.post(apiPaths.quizzes.submitQuiz(quizId), {
      answers,
    });

    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to submit quiz" };
  }
};

export const getQuizResults = async (quizId) => {
  try {
    const res = await api.get(apiPaths.quizzes.getQuizResults(quizId));

    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch quiz results" };
  }
};

export const deleteQuiz = async (quizId) => {
  try {
    const res = await api.delete(apiPaths.quizzes.deleteQuiz(quizId));
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to delete quiz" };
  }
};
