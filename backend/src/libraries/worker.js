import { Worker, Queue } from "bullmq";
import Document from "../models/Document.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { chunkText } from "../utils/textChunker.js";
import fs from "fs/promises"

// This worker processes jobs coming out of the 'pdf-processing' queue
const pdfWorker = new Worker(
  "pdf-processing",
  async (job) => {
    const { documentId, filePath } = job.data;

    try {
      // 1. Heavy computational work happens here on a separate background execution context
      const { text } = await extractTextFromPDF(filePath);
      const chunks = chunkText(text, 500, 50);

      // 2. Update database
      await Document.findByIdAndUpdate(documentId, {
        extractedText: text,
        chunks,
        status: "ready",
      });

      console.log(`[Worker] Document ${documentId} processed successfully`);
    } catch (err) {
      console.error(`[Worker] Error processing document ${documentId}:`, err);
      await Document.findByIdAndUpdate(documentId, { status: "failed" });

      // Throwing lets BullMQ mark the job status explicitly as 'failed'
      throw err;
    }

    try {
      await fs.unlink(filePath);
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.log(`Failed to delete file:`, err)
      }
    }
  },
  {
    connection: {
      url:
        process.env.NODE_ENV === "development"
          ? process.env.LOCAL_REDIS
          : process.env.CLOUD_REDIS,
    }, // Your Redis credentials
    concurrency: 5, // Limit: Max 5 PDFs processing at the exact same time
  },
);

pdfWorker.on("failed", (job, err) => {
  console.error(`Job ${job.id} failed natively with error: ${err.message}`);
});

// Instantiate the dispatch queue connection
export const pdfQueue = new Queue("pdf-processing", {
  connection: {
    url:
      process.env.NODE_ENV === "development"
        ? process.env.LOCAL_REDIS
        : process.env.CLOUD_REDIS,
  },
});