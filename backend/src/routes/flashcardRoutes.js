import { Router } from "express";
import * as flashcardController from "../controllers/flashcardController.js";
import protect from "../middleware/auth.js";

const router = Router();

router.use(protect);

router.get("/", flashcardController.getAllFlashcardSets);
router.get("/:documentId", flashcardController.getFlashcards);
router.get("/:cardId/page", flashcardController.getFlashcardSetById);
router.post("/:cardId/review", flashcardController.reviewFlashcard);
router.put("/:cardId/star", flashcardController.toggleStarFlashcard);
router.delete("/:id", flashcardController.deleteFlashcardSet);

export default router;
