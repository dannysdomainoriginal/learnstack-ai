import fs from "fs/promises";
import path from "path";
import Document from "../models/Document.js";
import Flashcard from "../models/Flashcard.js";
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";

export const getGeneratedFiles = async (req, res) => {
  try {
    const generatedDir = path.resolve(process.cwd(), "generated");

    await fs.mkdir(generatedDir, { recursive: true });
    const entries = await fs.readdir(generatedDir, { withFileTypes: true });

    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);

    return res.json({
      success: true,
      data: files,
    });
  } catch (err) {
    console.error("Failed to read ./generated directory:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to read generated directory",
    });
  }
};

export const getAdminDashboard = async (req, res) => {
  // Get admins
  const admins = await User.find({ roles: "admin" });
  const adminIds = admins.map((admin) => admin._id);
  const _id = { $nin: adminIds };

  // Get counts
  const totalDocuments = await Document.countDocuments({ _id });
  const totalFlashcardSets = await Flashcard.countDocuments({ _id });
  const totalQuizzes = await Quiz.countDocuments({ _id });

  // Aggregate ai-files collection for token-used count
};
