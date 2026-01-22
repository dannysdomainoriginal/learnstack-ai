import express from "express";
import protect from "../middleware/auth.js";
import { getGeneratedFiles } from "../controllers/adminController.js";

const router = express.Router();

router.get("/generated", protect, getGeneratedFiles);

export default router;
