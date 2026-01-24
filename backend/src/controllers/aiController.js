import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import ChatHistory from "../models/ChatHistory.js";
import * as geminiService from "../utils/geminiService.js";
import { findRelevantChunks } from "../utils/textChunker.js";

// @desc Generate flashcards from a document
// @route POST /api/ai/generate-flashcards
// @access Private
export const generateFlashcards = async (req, res) => {
  const { documentId, count = 10 } = req.body;

  if (!documentId) {
    return res.status(400).json({
      success: false,
      error: "Please provide a documentId",
      status: 400,
    });
  }

  const document = await Document.findOne({
    _id: documentId,
    userId: req.user._id,
    status: "ready",
  });

  if (!document) {
    res.status(404).json({
      success: false,
      error: "Document not found or not ready",
      status: 404,
    });
  }

  const cards = await geminiService.generateFlashcards(
    document.extractedText,
    parseInt(count)
  );

  // Save to db
  const flashcardSet = await Flashcard.create({
    title: `${document.title} - Card Set`,
    userId: req.user._id,
    documentId: document._id,
    cards: cards.map((card) => ({
      question: card.question,
      answer: card.answer,
      difficulty: card.difficulty,
      reviewCount: 0,
      isStarred: false,
    })),
  });

  res.status(201).json({
    success: true,
    data: flashcardSet,
    message: "Flashcards generated successfully",
  });
};

// @desc Generate quiz from a document
// @route POST /api/ai/generate-quiz
// @access Private
export const generateQuiz = async (req, res) => {
  const { documentId, numQuestions = 5, title } = req.body;

  if (!documentId) {
    return res.status(400).json({
      success: false,
      error: "Please provide a documentId",
      status: 400,
    });
  }

  const document = await Document.findOne({
    _id: documentId,
    userId: req.user._id,
    status: "ready",
  });

  if (!document) {
    res.status(404).json({
      success: false,
      error: "Document not found or not ready",
      status: 404,
    });
  }

  // Generate quiz using Gemini
  const questions = await geminiService.generateQuiz(
    document.extractedText,
    parseInt(numQuestions)
  );

  // Save to db
  const quiz = await Quiz.create({
    userId: req.user._id,
    documentId: document._id,
    title: title || `${document.title} - Quiz`,
    questions: questions,
    totalQuestions: questions.length,
    userAnswers: [],
    score: 0,
  });

  res.status(201).json({
    success: true,
    data: quiz,
    message: "Quiz generated successfully",
  });
};

// @desc Generate document summary
// @route POST /api/ai/generate-summary
// @access Private
export const generateSummary = async (req, res) => {
  const { documentId } = req.body;

  if (!documentId) {
    return res.status(400).json({
      success: false,
      error: "Please provide a documentId",
      status: 400,
    });
  }

  const document = await Document.findOne({
    _id: documentId,
    userId: req.user._id,
    status: "ready",
  });

  if (!document) {
    return res.status(404).json({
      success: false,
      error: "Document not found or not ready",
      status: 404,
    });
  }

  // Generate summary using Gemini
  const summary = await geminiService.generateSummary(document.extractedText);

  res.status(200).json({
    success: true,
    data: {
      documentId: document._id,
      title: document.title,
      summary,
    },
    message: "Summary generated successfully",
  });
};

// @desc Chat with document
// @route POST /api/ai/chat
// @access Private
export const chat = async (req, res) => {
  const { documentId, question } = req.body;

  if (!documentId || !question) {
    return res.status(400).json({
      success: false,
      error: "Please provide documentId and question",
      status: 400,
    });
  }

  const document = await Document.findOne({
    _id: documentId,
    userId: req.user._id,
    status: "ready",
  });

  if (!document) {
    return res.status(404).json({
      success: false,
      error: "Document not found or not ready",
      status: 404,
    });
  }

  // Get relevant chunks
  const relevantChunks = findRelevantChunks(document.chunks, question, 3);
  const chunkIndices = relevantChunks.map((c) => c.chunkIndex);

  // Get or create chat history
  const chatHistory = await ChatHistory.findOneAndUpdate(
    { userId: req.user._id, documentId: document._id },
    { $setOnInsert: { messages: [] } },
    { upsert: true, new: true }
  );

  // Generate responses
  const answer = await geminiService.chatWithContext(question, relevantChunks);

  // Persist conversation
  chatHistory.messages.push(
    {
      role: "user",
      content: question,
      timestamp: new Date(),
      relevantChunks: [],
    },
    {
      role: "assistant",
      content: answer,
      timestamp: new Date(),
      relevantChunks: chunkIndices,
    }
  );

  await chatHistory.save();

  res.status(200).json({
    success: true,
    data: {
      question,
      answer,
      relevantChunks: chunkIndices,
      chatHistoryId: chatHistory._id,
    },
    message: "Response generated successfully",
  });
};

// @desc Explain concept from document
// @route POST /api/ai/explain-concept
// @access Private
export const explainConcept = async (req, res) => {
  const { documentId, concept } = req.body;

  if (!documentId || !concept) {
    return res.status(400).json({
      success: false,
      error: "Please provide a documentId and concept",
      status: 400,
    });
  }

  const document = await Document.findOne({
    _id: documentId,
    userId: req.user._id,
    status: "ready",
  });

  if (!document) {
    return res.status(404).json({
      success: false,
      error: "Document not found or not ready",
      status: 404,
    });
  }

  // Find relevant chunks for the concept
  const relevantChunks = findRelevantChunks(document.chunks, concept, 3);
  const context = relevantChunks.map((c) => c.content).join("\n\n");

  // Generate explanation
  const explanation = await geminiService.explainConcept(concept, context);

  res.status(200).json({
    success: true,
    data: {
      concept,
      explanation,
      relevantChunks: relevantChunks.map((c) => c.chunkIndex),
    },
    message: "Explanation generated successfully",
  });
};

// @desc Get chat history for a document
// @route GET /api/ai/chat-history
// @access Private
export const getChatHistory = async (req, res) => {
  const { documentId } = req.params;

  if (!documentId) {
    return res.status(400).json({
      success: false,
      error: "Please provide a documentId",
      status: 400,
    });
  }

  const chatHistory = await ChatHistory.findOne({
    userId: req.user._id,
    documentId,
  }).select("messages");

  if (!chatHistory) {
    return res.status(200).json({
      success: true,
      data: [],
      message: "Send a message to behind chatting on this document",
    });
  }

  return res.status(200).json({
    success: true,
    data: chatHistory.messages,
    message: "Chat history retrieved successfully",
  });
};
