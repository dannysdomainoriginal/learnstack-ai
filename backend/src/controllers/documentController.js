import Document from "../models/Document.js";
import Quiz from "../models/Quiz.js";
import Flashcard from "../models/Flashcard.js";
import Upload from "../models/Upload.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { chunkText } from "../utils/textChunker.js";
import mongoose from "mongoose";
import { pdfQueue } from "../libraries/worker.js";

export const uploadDocument = async (req, res, next) => {
  let uploadedFile;
  try {
    const { file } = req.files;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: "Please upload a PDF file",
        status: 400,
      });
    }

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({
        success: false,
        error: "Please provide a document title",
        status: 400,
      });
    }

    const folder = "documents";
    let key = `${folder}/${Date.now()}-${crypto.randomUUID()}-${file.name}`;
    key = key.replaceAll(" ", "-");

    // Upload to Cloudflare R2
    uploadedFile = await Upload.uploadFile({
      path: file.path,
      key,
      mimetype: file.type,
      size: file.size,
      useCase: "document",
      user: req.user._id,
    });

    // Create document in DB
    const document = await Document.create({
      userId: req.user._id,
      title,
      fileName: file.name,
      url: uploadedFile.url, // public URL
      r2Key: key, // R2 key
      fileSize: file.size,
      status: "processing",
    });

    const documentId = document._id;

    try {
      // * Instead of locking the CPU, we push a minimal pointer payload into Redis
      await pdfQueue.add(
        `process-${documentId}`,
        {
          documentId,
          filePath: file.path,
        },
        { attempts: 3, backoff: 5000 },
      );

      // We immediately update the status to processing so the UI knows it's queued up
      await Document.findByIdAndUpdate(documentId, { status: "processing" });

      console.log(
        `Document ${documentId} successfully offloaded to background worker queue.`,
      );
    } catch (err) {
      console.error(`Error queuing document ${documentId}:`, err);
      await document.deleteOne();
      await Upload.deleteFile(uploadedFile.key);
      throw err;
    }

    res.status(201).json({
      success: true,
      data: document,
      message: "Document uploaded successfully. Processing in progress...",
    });
  } catch (err) {
    // Clean up file from R2 if uploaded
    if (uploadedFile) await Upload.deleteFile(uploadedFile.key);
    next(err);
  }
};

export const getDocuments = async (req, res) => {
  const documents = await Document.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(req.user._id) } },
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
    { $project: { extractedText: 0, chunks: 0, flashcardSets: 0, quizzes: 0 } },
    { $sort: { uploadedAt: -1 } },
  ]);

  res
    .status(200)
    .json({ success: true, count: documents.length, data: documents });
};

export const getDocumentById = async (req, res) => {
  const document = await Document.findOne({
    _id: req.params.id,
    userId: req.user._id,
  });

  if (!document) {
    return res
      .status(404)
      .json({ success: false, error: "Document not found", status: 404 });
  }

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
    return res
      .status(404)
      .json({ success: false, error: "Document does not exist", status: 404 });
  }

  // Delete file from Cloudflare R2
  const success = await Upload.deleteFile(document.r2Key);

  if (!success) {
    return res.status(500).json({
      success: false,
      error: `There was an error deleting your file.\nPlease try again`,
    });
  }

  await document.deleteOne();

  res.status(200).json({
    success: true,
    message: `Document: ${document.title} was successfully deleted`,
  });
};
