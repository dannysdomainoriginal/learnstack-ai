import { Router } from "express";
import * as aiController from "../controllers/aiController.js";
import protect from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.post("/generate-flashcards", aiController.generateFlashcards);
router.post("/generate-quiz", aiController.generateQuiz);
router.post("/generate-summary", aiController.generateSummary);
router.post("/chat", aiController.chat);
router.post("/explain-concept", aiController.explainConcept);
router.get("/chat-history/:documentId", aiController.getChatHistory);

export default router;
