import { useState, useEffect } from "react";
import toast from "react-hot-toast";

import { flashcardService, aiService } from "../../services";
import Modal from "../common/Modal";
import FlashcardViewer from "./FlashcardViewer";
import FlashcardSetsList from "./FlashcardSetsList";

const FlashcardManager = ({ documentId }) => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [setToDelete, setSetToDelete] = useState(null);

  const fetchFlashcardSets = async () => {
    setLoading(true);

    try {
      const { data } = await flashcardService.getSetsByDocument(documentId);
      setFlashcardSets(data);
    } catch (err) {
      toast.error(err.error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (documentId) {
      fetchFlashcardSets();
    }
  }, [documentId]);

  const handleGenerateFlashcards = async () => {
    setGenerating(true);

    try {
      const { data, message } = await aiService.generateFlashcards(documentId);

      toast.success(message);
      setFlashcardSets((prev) => [...prev, data]);
      fetchFlashcardSets();
    } catch (err) {
      toast.error(err.error);
    } finally {
      setGenerating(false);
    }
  };

  const handleNextCard = () => {
    if (!selectedSet) return;

    handleReview(currentCardIndex);
    setCurrentCardIndex((prev) =>
      prev + 1 < selectedSet.cards.length ? prev + 1 : prev,
    );
  };

  const handlePrevCard = () => {
    if (!selectedSet) return;

    handleReview(currentCardIndex);
    setCurrentCardIndex((prev) => (prev - 1 < 0 ? prev : prev - 1));
  };

  const handleReview = async (index) => {
    const currentCard = selectedSet?.cards[currentCardIndex];

    if (currentCard) {
      await flashcardService
        .reviewFlashcard(currentCard._id, index)
        .catch((err) => toast.error(err.error));
    }
  };

  const handleToggleStar = async (cardId) => {
    try {
      const { data, message } = await flashcardService.toggleStar(cardId);
      toast.success(message);
      setSelectedSet(data);

      setFlashcardSets((prev) => {
        return prev.map((set) => (set._id === selectedSet._id ? data : set));
      });
    } catch (err) {
      toast.error(err.error);
    }
  };

  const handleDeleteRequest = (e, set) => {
    e.stopPropagation();
    setSetToDelete(set);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!setToDelete) return;
    setDeleting(true);

    try {
      const { message } = await flashcardService.deleteFlashcardSet(
        setToDelete._id,
      );
      toast.success(message);
      setIsDeleteModalOpen(false);
      setSetToDelete(null);
      setFlashcardSets((prev) => prev.filter((i) => i._id !== setToDelete._id));
    } catch (err) {
      toast.error(err.error);
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectSet = (set) => {
    setSelectedSet(set);
    setCurrentCardIndex(0);
  };

  return (
    <>
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-3xl shadow-xl shadow-slate-200/50 p-8">
        {selectedSet ? (
          <FlashcardViewer
            selectedSet={selectedSet}
            currentCardIndex={currentCardIndex}
            setSelectedSet={setSelectedSet}
            handleNextCard={handleNextCard}
            handlePrevCard={handlePrevCard}
            handleToggleStar={handleToggleStar}
          />
        ) : (
          <FlashcardSetsList
            loading={loading}
            flashcardSets={flashcardSets}
            generating={generating}
            handleGenerateFlashcards={handleGenerateFlashcards}
            handleSelectSet={handleSelectSet}
            handleDeleteRequest={handleDeleteRequest}
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        closeModal={() => setIsDeleteModalOpen(false)}
        title="Delete Flashcard Set?"
      >
        <div className="space-y-6">
          <p className="text-sm text-slate-600">
            Are you sure you want to delete this flashcard set? <br />
            This action cannot be undone and all cards will be{" "}
            <b>permanently</b> removed.
          </p>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleting}
              className="px-5 h-11 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-sm rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-5 h-11 bg-linear-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white font-semibold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-rose-500/25 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              {deleting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </span>
              ) : (
                "Yes, do it"
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FlashcardManager;
