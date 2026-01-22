import Document from "../models/Document.js";
import Quiz from "../models/Quiz.js";
import Flashcard from "../models/Flashcard.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { chunkText } from "../utils/textChunker.js";
import fs from "fs/promises";
import mongoose from "mongoose";

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a PDF file",
        status: 400,
      });
    }

    const { title } = req.body;

    if (!title) {
      // Delete uploaded file
      await fs.unlink(req.file.path);
      return res.status(400).json({
        success: false,
        error: "Please provide a document title",
        status: 400,
      });
    }

    // Construct the URL for the uploaded file
    const baseUrl = `http://localhost:${process.env.PORT || 8000}`;
    const fileUrl = `${baseUrl}/uploads/documents/${req.file.filename}`;

    // Create document in the db
    const document = await Document.create({
      userId: req.user._id,
      title,
      fileName: req.file.originalname,
      filePath: fileUrl,
      diskPath: req.file.path,
      fileSize: req.file.size,
      status: "processing",
    });

    // todo Process PDF in the background ( in production, use a queue like Bull )
    processPDF(document._id, req.file.path).catch(async (err) => {
      await document.deleteOne();
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(500).json({
        success: false,
        error: "Error processing your pdf document",
        status: 500,
      });
    });

    res.status(201).json({
      success: true,
      data: document,
      message: "Document uploaded successfully. Processing in progress...",
    });
  } catch (err) {
    // Clean up file on error
    if (req.file) {
      await fs.unlink(req.file.path).catch(() => {});
    }
    next(err);
  }
};

// processPDF service
const processPDF = async (documentId, filePath) => {
  try {
    const { text } = await extractTextFromPDF(filePath);

    // Create chunks
    const chunks = chunkText(text, 500, 50);

    // Update document
    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks,
      status: "ready",
    });

    console.log(`Document ${documentId} processed successfully`);
  } catch (err) {
    console.error(`Error processing document ${documentId}:`, err);

    await Document.findByIdAndUpdate(documentId, {
      status: "failed",
    });

    throw err;
  }
};

export const getDocuments = async (req, res) => {
  const documents = await Document.aggregate([
    {
      $match: { userId: new mongoose.Types.ObjectId(req.user._id) },
    },
    {
      $lookup: {
        from: "flashcards",
        localField: "_id",
        foreignField: "documentId",
        as: "flashcardSets",
      },
    },
    {
      $lookup: {
        from: "quizzes",
        localField: "_id",
        foreignField: "documentId",
        as: "quizzes",
      },
    },
    {
      $addFields: {
        flashcardCount: { $size: "$flashcardSets" },
        quizCount: { $size: "$quizzes" },
      },
    },
    {
      $project: {
        extractedText: 0,
        chunks: 0,
        flashcardSets: 0,
        quizzes: 0,
      },
    },
    {
      $sort: { uploadedAt: -1 },
    },
  ]);

  res.status(200).json({
    success: true,
    count: documents.length,
    data: documents,
  });
};

export const getDocumentById = async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!document) {
    res.status(404).json({
      success: false,
      error: "Document not found",
      status: 404,
    });
  }

  // Get flashcardCounts and quizCounts
  const { _id: documentId } = document;
  const { _id: userId } = req.user;

  const flashcardCount = await Flashcard.countDocuments({ documentId, userId });
  const quizCount = await Quiz.countDocuments({ documentId, userId });

  document.lastAccessed = Date.now();
  await document.save();

  res.status(200).json({
    success: true,
    data: {
      ...document.toObject(),
      flashcardCount,
      quizCount,
    },
  });
};

export const deleteDocument = async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!document) {
    return res.status(404).json({
      success: false,
      error: "Document does not exist",
      status: 404,
    });
  }

  // Delete file from disk
  setImmediate(() => {
    fs.unlink(document.diskPath).catch(() => {});
  });

  await document.deleteOne();

  res.status(200).json({
    success: true,
    message: `Document: ${document.title} was successfully deleted`,
  });
};
