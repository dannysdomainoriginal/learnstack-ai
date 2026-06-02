import { Router } from "express";
import formData from "express-form-data";
import os from "os";

import adminRoutes from "./adminRoutes.js";
import authRoutes from "./authRoutes.js";
import documentRoutes from "./documentRoutes.js";
import flashcardRoutes from "./flashcardRoutes.js";
import aiRoutes from "./aiRoutes.js";
import quizRoutes from "./quizRoutes.js";
import progressRoutes from "./progressRoutes.js";

const router = Router();

router.use(
  formData.parse({
    uploadDir: os.tmpdir(),
  }),
  formData.format(),
);

// Routes
router.use("/admin", adminRoutes);
router.use("/auth", authRoutes);
router.use("/documents", documentRoutes);
router.use("/flashcards", flashcardRoutes);
router.use("/ai", aiRoutes);
router.use("/quizzes", quizRoutes);
router.use("/progress", progressRoutes);

export default router;
