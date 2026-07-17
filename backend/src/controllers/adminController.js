import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";
import AiFiles from "../models/AiFiles.js";
import Upload from "../models/Upload.js";

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
/*                               GET DASHBOARD                                */
/* -------------------------------------------------------------------------- */
export const getDashboard = async (req, res) => {
  try {
    // 1. Get admin IDs to exclude internal activity
    const admins = await User.find({ roles: "admin" }).select("_id");
    const adminIds = admins.map((a) => a._id);

    const baseMatch = {
      userId: { $nin: adminIds },
    };

    // 2. Shared aggregation pipeline builder
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

    // 3. Run all aggregations in parallel (including local Upload collection)
    const [
      usersTotal,
      documentsAgg,
      flashcardsAgg,
      quizzesAgg,
      aiFilesAgg,
      uploadsAgg,
    ] = await Promise.all([
      // Users Count
      User.countDocuments({ _id: { $nin: adminIds } }),

      // Documents Stats
      Document.aggregate(statsPipeline()),

      // Flashcards Stats
      Flashcard.aggregate(statsPipeline()),

      // Quizzes Stats
      Quiz.aggregate(statsPipeline()),

      // AI Files Stats
      AiFiles.aggregate(
        statsPipeline({
          tokensUsed: { $sum: "$tokensUsed" },
        }),
      ),

      // Upload model DB aggregation (excl. Admin uploads)
      Upload.aggregate([
        { $match: { uploaderId: { $nin: adminIds } } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            latest: { $max: "$uploadedAt" },
            totalSize: { $sum: "$size" }, // Accumulates size key in bytes
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            latest: 1,
            totalSize: 1,
          },
        },
      ]),
    ]);

    // 4. Helper to normalize empty query responses
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

    const uploads = uploadsAgg[0] || {
      total: 0,
      latest: null,
      totalSize: 0,
    };

    // Helper to format date strings cleanly
    const formatDate = (date) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    };

    // 5. Build dynamic statistics payload match to the old nesting pattern
    res.status(200).json({
      success: true,
      message: `Welcome ${req.user.username}!`,
      data: {
        stats: {
          users: {
            total: usersTotal,
            latest: "N/A", // Handled if user registration tracking is added
            active: usersTotal, // Placeholder or active session data if tracked
          },
          documents: {
            total: documents.total,
            latest: formatDate(documents.latest),
            users: documents.users,
          },
          quizzes: {
            total: quizzes.total,
            latest: formatDate(quizzes.latest),
            users: quizzes.users,
          },
          flashcards: {
            total: flashcards.total,
            latest: formatDate(flashcards.latest),
            users: flashcards.users,
          },
          aiFiles: {
            total: aiFiles.total,
            latest: formatDate(aiFiles.latest),
            tokensUsed: aiFiles.tokensUsed,
          },
          uploads: {
            total: uploads.total,
            latest: formatDate(uploads.latest),
            storageUsed: `${(uploads.totalSize / 1024 ** 3).toFixed(2)} GB`,
          },
        },
        analytics: {}, // Left empty as per the original schema
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Fetch Error: ", error);
    res.status(500).json({
      success: false,
      message: "Error generating dashboard statistics",
      error: error.message,
    });
  }
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

  const deleted = await Upload.deleteFile(document.r2Key);

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
