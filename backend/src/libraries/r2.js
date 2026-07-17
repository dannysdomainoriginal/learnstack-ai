import "dotenv/config";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import fs from "fs";

export const r2 = new S3Client({
  region: "auto", // Cloudflare recommends "auto"
  endpoint: process.env.R2_ENDPOINT, // e.g., "https://<accountid>.r2.cloudflarestorage.com"
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
  },
});
