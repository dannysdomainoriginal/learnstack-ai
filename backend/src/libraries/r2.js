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

// Upload a file (stream or tmp path)
export const uploadFile = async ({
  filePath,
  fileName,
  contentType,
  folder = "documents",
}) => {
  const key = `${folder}/${Date.now()}-${crypto.randomUUID()}-${fileName}`;

  await r2.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      Body: fs.createReadStream(filePath),
      ContentType: contentType,
    }),
  );

  return {
    key,
    url: `${process.env.R2_PUBLIC_URL}/${key}`,
  };
};

// Delete a file by key
export const deleteFile = async (key) => {
  try {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
      }),
    );
    return true;
  } catch (err) {
    console.error("R2 delete error:", err);
    return false;
  }
};
