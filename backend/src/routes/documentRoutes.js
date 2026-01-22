import { Router } from "express";
import * as documentController from "../controllers/documentController.js"
import protect from "../middleware/auth.js"
import upload from "../config/multer.js"

const router = Router()

router.use(protect)

router.post("/upload", upload.single("file"), documentController.uploadDocument)
router.get("/", documentController.getDocuments)
router.get("/:id", documentController.getDocumentById);
router.delete("/:id", documentController.deleteDocument)

export default router