import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import os from "os";
import morgan from "morgan";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import errorHandler from "./middleware/errorHandler.js";
import formData from "express-form-data";
import parser from "cookie-parser";

import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import flashcardRoutes from "./routes/flashcardRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import quizRoutes from "./routes/quizRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";

// ES6 module __dirname alternative
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();
const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(parser());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);

// Static folder for uploads
if (process.env.NODE_ENV === "development") {
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
}

app.use("/generated", express.static(path.join(process.cwd(), "generated")));

app.use(
  formData.parse({
    uploadDir: os.tmpdir(),
  }),
  formData.format(),
);

// Routes
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/flashcards", flashcardRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/progress", progressRoutes);

// Frontend routing
if (process.env.NODE_ENV === "production") {
  const frontendDir = path.join(__dirname, "..", "..", "frontend", "dist");

  app.use(express.static(frontendDir));

  // send index.html
  app.use((req, res, next) => {
    const apiNotFound = !req.path.includes("/api");
    return apiNotFound
      ? res.sendFile(path.join(frontendDir, "index.html"))
      : next();
  });
}

app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    status: 404,
    error: `Cannot ${req.method} ${req.url}`,
  });
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err.message}`);
  process.exit(1);
});
