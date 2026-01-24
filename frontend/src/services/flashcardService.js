import api from "../utils/axiosInstance";
import { apiPaths } from "../utils/apiPaths";

export const getAllFlashcardSets = async () => {
  try {
    const res = await api.get(apiPaths.flashcards.getAllFlashcardSets);
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch flashcard sets" };
  }
};

export const getSetsByDocument = async (documentId) => {
  try {
    const res = await api.get(
      apiPaths.flashcards.getSetsByDocument(documentId)
    );
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to fetch flashcards" };
  }
};

export const getFlashcardSetById = async (id) => {
  try {
    const res = await api.get(apiPaths.flashcards.getFlashcardSetById(id));

    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Error fetching your flashcard" };
  }
};

export const reviewFlashcard = async (cardId, cardIndex) => {
  try {
    const res = await api.post(apiPaths.flashcards.reviewFlashcard(cardId), {
      cardIndex,
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Error marking flashcard as reviewed" };
  }
};

export const toggleStar = async (cardId) => {
  try {
    const res = await api.put(apiPaths.flashcards.toggleStar(cardId));
    return res.data;
  } catch (error) {
    throw (
      error.response?.data || { error: "Failed to star / unstar flashcard" }
    );
  }
};

export const deleteFlashcardSet = async (id) => {
  try {
    const res = await api.delete(apiPaths.flashcards.deleteFlashcardSet(id));
    return res.data;
  } catch (error) {
    throw error.response?.data || { error: "Failed to delete flashcard set" };
  }
};
