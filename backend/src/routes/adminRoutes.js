import express from "express";
import protect from "../middleware/auth.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

router.use(protect)
router.use((req, res, next) => {
  // isAdmin guard
  next()
})

router.get("/", protect, adminController.getDashboard);

export default router;
