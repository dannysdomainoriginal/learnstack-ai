// documentController.js
import Document from "../models/Document.js";
import Quiz from "../models/Quiz.js";
import Flashcard from "../models/Flashcard.js";
import { extractTextFromPDF } from "../utils/pdfParser.js"
import { chunkText } from "../utils/textChunker.js";
import mongoose from "mongoose";
import { uploadFile, deleteFile } from "../libraries/r2.js";

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

    // Upload to Cloudflare R2
    uploadedFile = await uploadFile({
      filePath: file.path,
      fileName: file.name,
      contentType: file.type,
    }).catch((err) => {
      throw new Error("Error uploading your document to our cloud storage.\nPlease try again.")
    })

    // Create document in DB
    const document = await Document.create({
      userId: req.user._id,
      title,
      fileName: file.name,
      url: uploadedFile.url, // public URL
      r2Key: uploadedFile.key, // R2 key
      fileSize: file.size,
      status: "processing",
    });

    // Fire-and-forget PDF processing
    processPDF(document._id, file.path).catch(async (err) => {
      console.error(err);
      await document.deleteOne();
      await deleteFile(uploadedFile.key);
    });

    res.status(201).json({
      success: true,
      data: document,
      message: "Document uploaded successfully. Processing in progress...",
    });
  } catch (err) {
    // Clean up file from R2 if uploaded
    if (uploadedFile) await deleteFile(uploadedFile.key);
    next(err);
  }
};

// processPDF service (unchanged signature, uses tmp file path)
async function processPDF (documentId, filePath) {
  try {
    const { text } = await extractTextFromPDF(filePath);

    const chunks = chunkText(text, 500, 50);

    await Document.findByIdAndUpdate(documentId, {
      extractedText: text,
      chunks,
      status: "ready",
    });

    console.log(`Document ${documentId} processed successfully`);
  } catch (err) {
    console.error(`Error processing document ${documentId}:`, err);
    await Document.findByIdAndUpdate(documentId, { status: "failed" });
    throw err;
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
  await deleteFile(document.r2Key);
  await document.deleteOne();

  res.status(200).json({
    success: true,
    message: `Document: ${document.title} was successfully deleted`,
  });
};
