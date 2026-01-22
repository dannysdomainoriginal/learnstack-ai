import { Router } from "express";
import * as quizController from "../controllers/quizController.js";
import protect from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/:documentId", quizController.getQuizzes);
router.get("/quiz/:id", quizController.getQuizById);
router.post("/:id/submit", quizController.submitQuiz);
router.get("/:id/results", quizController.getQuizResults);
router.delete("/:id", quizController.deleteQuiz);

export default router;
