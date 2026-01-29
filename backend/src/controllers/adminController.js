import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";
import AiFiles from "../models/AiFiles.js";
import { deleteFile, getR2UsageStats } from "../libraries/r2.js";

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const getAdminIds = async () => {
  const admins = await User.find({ roles: "admin" }).select("_id");
  return admins.map((a) => a._id);
};

const paginate = (req) => {
  const limit = parseInt(req.query.limit);
  const page = parseInt(req.query.page);

  if (!limit || !page) return null;

  const skip = (page - 1) * limit;
  return { limit, skip };
};

/* -------------------------------------------------------------------------- */
/*                           OLD DASHBOARD IN PLACE                           */
/* -------------------------------------------------------------------------- */
export const getDashboard = async (req, res) => {
  res.status(201).json({
    success: false,
    message: `Welcome ${req.user.username}!`,
    data: {
      stats: {
        users: {
          total: 128,
          latest: "Tue 27 Jan, 2026",
          active: 42,
        },
        documents: {
          total: 10,
          latest: "Tue 27 Jan, 2026",
          users: 15,
        },
        quizzes: {
          total: 20,
          latest: "Tue 27 Jan, 2026",
          users: 8,
        },
        flashcards: {
          total: 30,
          latest: "Tue 27 Jan, 2026",
          users: 9,
        },
        aiFiles: {
          total: 10,
          latest: "Tue 27 Jan, 2026",
          tokensUsed: 5320,
        },
        uploads: {
          total: 10, // todo get from cloudfare
          latest: "Tue 27 Jan, 2026",
          storageUsed: 12.4 + "GB",
        },
      },
      analytics: {},
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                          GET DASHBOARDS STATISTICS                         */
/* -------------------------------------------------------------------------- */
export const getDashboardStatistics = async (req, res) => {
  // 1. Get admin IDs (exclude internal activity)
  const admins = await User.find({ roles: "admin" }).select("_id");
  const adminIds = admins.map((a) => a._id);

  const baseMatch = {
    userId: { $nin: adminIds },
  };

  // 2. Shared aggregation builder
  const statsPipeline = (extraGroup = {}) => [
    { $match: baseMatch },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        latest: { $max: "$updatedAt" },
        users: { $addToSet: "$userId" },
        ...extraGroup,
      },
    },
    {
      $project: {
        _id: 0,
        total: 1,
        latest: 1,
        users: { $size: "$users" },
        ...Object.keys(extraGroup).reduce((acc, k) => {
          acc[k] = 1;
          return acc;
        }, {}),
      },
    },
  ];

  // 3. Run everything in parallel
  const [
    usersTotal,
    documentsAgg,
    flashcardsAgg,
    quizzesAgg,
    aiFilesAgg,
    r2Stats,
  ] = await Promise.all([
    User.countDocuments({ _id: { $nin: adminIds } }),

    Document.aggregate(statsPipeline()),

    Flashcard.aggregate(statsPipeline()),

    Quiz.aggregate(statsPipeline()),

    AiFiles.aggregate(
      statsPipeline({
        tokensUsed: { $sum: "$tokensUsed" },
      }),
    ),

    getR2UsageStats(), // authoritative Cloudflare data
  ]);

  // 4. Normalize empty aggregates
  const normalize = (agg) => agg[0] || { total: 0, latest: null, users: 0 };

  const documents = normalize(documentsAgg);
  const flashcards = normalize(flashcardsAgg);
  const quizzes = normalize(quizzesAgg);
  const aiFiles = aiFilesAgg[0] || {
    total: 0,
    latest: null,
    users: 0,
    tokensUsed: 0,
  };

  // 5. Final response
  res.status(200).json({
    success: true,
    message: `Welcome ${req.user.username}!`,
    data: {
      users: {
        total: usersTotal,
      },

      documents: {
        total: documents.total,
        latest: documents.latest,
        users: documents.users,
      },

      flashcards: {
        total: flashcards.total,
        latest: flashcards.latest,
        users: flashcards.users,
      },

      quizzes: {
        total: quizzes.total,
        latest: quizzes.latest,
        users: quizzes.users,
      },

      aiFiles: {
        total: aiFiles.total,
        latest: aiFiles.latest,
        tokensUsed: aiFiles.tokensUsed,
      },

      uploads: {
        total: r2Stats?.objectCount || 0,
        storageUsed: r2Stats
          ? `${(r2Stats.storageBytes / 1024 ** 3).toFixed(2)} GB`
          : "0 GB",
        reads: r2Stats?.reads || 0,
        writes: r2Stats?.writes || 0,
      },
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                           GET DASHBOARD ANALYTICS                          */
/* -------------------------------------------------------------------------- */
export const getDashboardAnalytics = async (req, res) => {};

/* -------------------------------------------------------------------------- */
/*                                GET DOCUMENTS                               */
/* -------------------------------------------------------------------------- */

export const getDocuments = async (req, res) => {
  const adminIds = await getAdminIds();
  const pagination = paginate(req);

  const pipeline = [
    { $match: { userId: { $nin: adminIds } } },
    {
      $lookup: {
        from: "flashcards",
        localField: "_id",
        foreignField: "documentId",
        as: "flashcards",
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
        flashcardCount: { $size: "$flashcards" },
        quizCount: { $size: "$quizzes" },
      },
    },
    {
      $project: {
        extractedText: 0,
        chunks: 0,
        flashcards: 0,
        quizzes: 0,
      },
    },
    { $sort: { uploadedAt: -1 } },
  ];

  if (pagination) {
    pipeline.push({ $skip: pagination.skip });
    pipeline.push({ $limit: pagination.limit });
  }

  const documents = await Document.aggregate(pipeline);

  res.status(200).json({
    success: true,
    count: documents.length,
    data: documents,
  });
};

/* -------------------------------------------------------------------------- */
/*                             GET DOCUMENT BY ID                             */
/* -------------------------------------------------------------------------- */

export const getDocumentById = async (req, res) => {
  const document = await Document.findById(req.params.id).lean();

  if (!document) {
    return res.status(404).json({
      success: false,
      error: "Document not found",
      status: 404,
    });
  }

  const [flashcardCount, quizCount] = await Promise.all([
    Flashcard.countDocuments({ documentId: document._id }),
    Quiz.countDocuments({ documentId: document._id }),
  ]);

  await Document.updateOne(
    { _id: document._id },
    { $set: { lastAccessed: Date.now() } },
  );

  res.status(200).json({
    success: true,
    data: {
      ...document,
      flashcardCount,
      quizCount,
    },
  });
};

/* -------------------------------------------------------------------------- */
/*                              DELETE DOCUMENT                               */
/* -------------------------------------------------------------------------- */

export const deleteDocument = async (req, res) => {
  const document = await Document.findById(req.params.id);

  if (!document) {
    return res.status(404).json({
      success: false,
      error: "Document does not exist",
      status: 404,
    });
  }

  const deleted = await deleteFile(document.r2Key);

  if (!deleted) {
    return res.status(500).json({
      success: false,
      error: "There was an error deleting your file. Please try again.",
    });
  }

  await Promise.all([
    Flashcard.deleteMany({ documentId: document._id }),
    Quiz.deleteMany({ documentId: document._id }),
    document.deleteOne(),
  ]);

  res.status(200).json({
    success: true,
    message: `Document: ${document.title} was successfully deleted`,
  });
};

/* -------------------------------------------------------------------------- */
/*                                   GET ALL                                  */
/* -------------------------------------------------------------------------- */

export const getAllItems = (filetype) => {
  const models = {
    document: Document,
    flashcard: Flashcard,
    quiz: Quiz,
    user: User,
    aiFiles: AiFiles,
  };

  const model = models[filetype.toLowerCase()];
  if (!model) throw new Error("Invalid model type");

  return async (req, res) => {
    const pagination = paginate(req);

    let query = model.find().sort({ createdAt: -1 });

    if (filetype !== "user") {
      query = query.populate("documentId", "title");
    }

    if (pagination) {
      query = query.skip(pagination.skip).limit(pagination.limit);
    }

    const items = await query.lean();

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  };
};

/* -------------------------------------------------------------------------- */
/*                         GET ITEMS BY DOCUMENT ID                            */
/* -------------------------------------------------------------------------- */

export const getItemsByDocumentId = (filetype) => {
  const models = {
    flashcard: Flashcard,
    quiz: Quiz,
  };

  const model = models[filetype.toLowerCase()];
  if (!model) throw new Error("Invalid model type");

  return async (req, res) => {
    const items = await model
      .find({ documentId: req.params.documentId })
      .populate("documentId", "title fileName")
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  };
};

/* -------------------------------------------------------------------------- */
/*                              GET ITEM BY ID                                */
/* -------------------------------------------------------------------------- */

export const getItemById = (filetype) => {
  const models = {
    document: Document,
    flashcard: Flashcard,
    quiz: Quiz,
    user: User,
    aiFiles: AiFiles,
  };

  const model = models[filetype.toLowerCase()];
  if (!model) throw new Error("Invalid model type");

  return async (req, res) => {
    const item = await model.findById(req.params.id).lean();

    if (!item) {
      return res.status(404).json({
        success: false,
        error: `Your ${filetype} is missing`,
        status: 404,
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  };
};

/* -------------------------------------------------------------------------- */
/*                         GET AI FILES BY USER ID                             */
/* -------------------------------------------------------------------------- */

export const getAiFilesByUser = async (req, res) => {
  const files = await AiFiles.find({ userId: req.params.userId })
    .populate("userId", "username")
    .sort({ createdAt: -1 })
    .lean();

  res.status(200).json({
    success: true,
    count: files.length,
    data: files,
  });
};

/* -------------------------------------------------------------------------- */
/*                              MAKE FILE PUBLIC                               */
/* -------------------------------------------------------------------------- */

export const makeFilePublic = (filetype) => {
  const models = {
    document: Document,
    flashcard: Flashcard,
    quiz: Quiz,
  };

  const model = models[filetype.toLowerCase()];
  if (!model) throw new Error("Invalid model type");

  return async (req, res) => {
    const item = await model.findByIdAndUpdate(
      req.params.id,
      { public: true },
      { new: true },
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        error: "Your item was not found",
        status: 404,
      });
    }

    res.status(200).json({
      success: true,
      data: item,
      message: `${filetype} has been added to the public library`,
    });
  };
};
