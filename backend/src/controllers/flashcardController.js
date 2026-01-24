import Flashcard from "../models/Flashcard.js";

// @desc Get all flashcards for a document
// @route GET /api/flashcards/:documentId
// @access Private
export const getFlashcards = async (req, res) => {
  const flashcards = await Flashcard.find({
    userId: req.user._id,
    documentId: req.params.documentId,
  })
    .populate("documentId", "title fileName")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: flashcards.length,
    data: flashcards,
  });
};

// @desc Get all flashcard sets for a user
// @route GET /api/flashcards
// @access Private
export const getAllFlashcardSets = async (req, res) => {
  const flashcardSets = await Flashcard.find({ userId: req.user._id })
    .populate("documentId", "title")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: flashcardSets.length,
    data: flashcardSets,
  });
};

// @desc Get a flashcard by id ( for independent flashcard pages )
// @route GET /api/flashcards/:cardId/page
// @access Private
export const getFlashcardSetById = async (req, res) => {
  const flashcard = await Flashcard.findOne({
    _id: req.params.cardId,
    userId: req.user._id,
  });

  if (!flashcard) {
    return res.status(404).json({
      success: false,
      error: "Flashcard was not found",
      status: 404,
    });
  }

  res.status(200).json({
    success: true,
    data: flashcard,
  });
};

// @desc Mark flashcard as reviewed
// @route POST /api/flashcards/:cardId/review
// @access Private
export const reviewFlashcard = async (req, res) => {
  const flashcardSet = await Flashcard.findOne({
    "cards._id": req.params.cardId,
    userId: req.user._id,
  });

  if (!flashcardSet) {
    return res.status(404).json({
      success: false,
      error: "Flashcard set or card not found",
      status: 404,
    });
  }

  const cardIndex = flashcardSet.cards.findIndex(
    (card) => card._id.toString() === req.params.cardId,
  );

  if (cardIndex === -1) {
    return res.status(404).json({
      success: false,
      error: "Card not found in set",
      status: 404,
    });
  }

  // Update review info
  flashcardSet.cards[cardIndex].lastReviewed = new Date();
  flashcardSet.cards[cardIndex].reviewCount++;

  await flashcardSet.save();

  res.status(200).json({
    success: true,
    data: flashcardSet,
    message: "Flashcard review successful",
  });
};

// @desc Toggle star on flashcard
// @route PUT /api/flashcards/:cardId/star
// @access Private
export const toggleStarFlashcard = async (req, res) => {
  const flashcardSet = await Flashcard.findOne({
    "cards._id": req.params.cardId,
    userId: req.user._id,
  });

  if (!flashcardSet) {
    return res.status(404).json({
      success: false,
      error: "Flashcard set or card not found",
      status: 404,
    });
  }

  const cardIndex = flashcardSet.cards.findIndex(
    (card) => card._id.toString() === req.params.cardId,
  );

  if (cardIndex === -1) {
    return res.status(404).json({
      success: false,
      error: "Card not found in set",
      status: 404,
    });
  }

  flashcardSet.cards[cardIndex].isStarred =
    !flashcardSet.cards[cardIndex].isStarred;
  const check = flashcardSet.cards[cardIndex].isStarred;

  await flashcardSet.save();

  res.status(200).json({
    success: true,
    data: flashcardSet,
    message: `Flashcard ${check ? "starred" : "unstarred"} successfully`,
  });
};

// @desc Delete flashcard set
// @route DELETE /api/flashcards/:id
// @access Private
export const deleteFlashcardSet = async (req, res) => {
  const flashcardSet = await Flashcard.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!flashcardSet) {
    return res.status(404).json({
      success: false,
      error: "Flashcard set not found",
      status: 404,
    });
  }

  await flashcardSet.deleteOne();

  res.status(200).json({
    success: true,
    message: "Flashcard set deleted successfully",
  });
};
