import mongoose from "mongoose";

const aiFileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: ["flashcard", "quiz", "explanation", "summary", "chat"],
      required: true,
    },

    model: {
      type: String, // e.g. "gpt-4o-mini"
      required: true,
    },

    tokensUsed: {
      type: Number,
      required: true,
      min: 0,
    },

    link: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
  },
);

aiFileSchema.index({ userId: 1, createdAt: -1 });
aiFileSchema.index({ type: 1 });
aiFileSchema.index({ tokensUsed: 1, model: 1 });

const AiFiles = mongoose.model("AI-File", aiFileSchema);
export default AiFiles;
