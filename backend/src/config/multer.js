import multer from "multer";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const r2 = new S3Client({
  region: "auto", // Cloudflare recommends "auto"
  endpoint: process.env.R2_ENDPOINT, // e.g., "https://<accountid>.r2.cloudflarestorage.com"
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});

// Custom storage engine
const multerR2Storage = {
  _handleFile: async (req, file, cb) => {
    try {
      const uniqueSuffix = Date.now() + "-" + crypto.randomUUID();
      const key = `documents/${uniqueSuffix}-${file.originalname}`;

      await r2.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
          Body: file.stream,
          ContentType: file.mimetype,
        }),
      );

      // Build a "disk-like" file object
      const fileRecord = {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size || 0, // Multer may not know size in streaming
        key,
        url: `https://${process.env.R2_BUCKET}.${process.env.R2_ENDPOINT.replace(/^https?:\/\//, "")}/${key}`,
      };

      console.log(fileRecord)

      cb(null, fileRecord);
    } catch (err) {
      cb(err);
    }
  },

  _removeFile: (req, file, cb) => {
    // Optional: you could delete from R2 if needed
    cb(null);
  },
};

// Export Multer instance
export const upload = multer({
  storage: multerR2Storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are allowed"), false);
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
});
