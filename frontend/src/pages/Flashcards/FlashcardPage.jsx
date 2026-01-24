import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import FlashcardViewer from "../../components/flashcards/FlashcardViewer";
import { flashcardService } from "../../services";
import FlashcardHeader from "../../components/flashcards/FlashcardHeader";

const FlashcardPage = () => {
  const { setId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [cardSet, setCardSet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    const fetchCardSet = async () => {
      try {
        const { data } = await flashcardService.getFlashcardSetById(setId);
        console.log(data);
        setCardSet(data);
      } catch (err) {
        toast.error(err.error);
      } finally {
        setLoading(false);
      }
    };

    fetchCardSet();
  }, [setId]);

  const handleReview = async (index) => {
    const currentCard = cardSet?.cards[currentCardIndex];

    if (currentCard) {
      await flashcardService
        .reviewFlashcard(currentCard._id, index)
        .catch((err) => toast.error(err.error));
    }
  };

  const handleNextCard = () => {
    if (!cardSet) return;

    handleReview(currentCardIndex);
    setCurrentCardIndex((prev) =>
      prev + 1 < cardSet.cards.length ? prev + 1 : prev,
    );
  };

  const handlePrevCard = () => {
    if (!cardSet) return;

    handleReview(currentCardIndex);
    setCurrentCardIndex((prev) => (prev - 1 < 0 ? prev : prev - 1));
  };

  const handleToggleStar = async (cardId) => {
    try {
      const { data, message } = await flashcardService.toggleStar(cardId);
      toast.success(message);
      setCardSet(data);
    } catch (err) {
      toast.error(err.error);
    }
  };

  if (loading) {
    return null;
  }

  if (!cardSet) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-slate-600 text-lg">
            Your flashcard set is missing
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <FlashcardHeader
        cardSet={cardSet}
        backToSets={() => navigate("/flashcards", { replace: true })}
      />
      <div className="mb-10" />
      <FlashcardViewer
        selectedSet={cardSet}
        currentCardIndex={currentCardIndex}
        setSelectedSet={setCardSet}
        handleNextCard={handleNextCard}
        handlePrevCard={handlePrevCard}
        handleToggleStar={handleToggleStar}
        backButtonAction={() => navigate("/flashcards")}
        flashcardPage={true}
      />
    </div>
  );
};

export default FlashcardPage;
