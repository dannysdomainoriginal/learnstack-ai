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

/* -------------------------------------------------------------------------- */
/*                               Get usage stats                              */
/* -------------------------------------------------------------------------- */
export const getR2UsageStats = async () => {
  const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: `
        query R2Usage($accountTag: String!) {
          viewer {
            accounts(filter: { accountTag: $accountTag }) {
              r2StorageAdaptiveGroups(limit: 1) {
                max {
                  payloadSize
                  objectCount
                }
                sum {
                  readRequests
                  writeRequests
                }
              }
            }
          }
        }
      `,
      variables: {
        accountTag: process.env.CLOUDFLARE_ACCOUNT_ID,
      },
    }),
  });

  const json = await res.json();

  const group = json?.data?.viewer?.accounts?.[0]?.r2StorageAdaptiveGroups?.[0];

  if (!group) return null;

  return {
    storageBytes: group.max.payloadSize,
    objectCount: group.max.objectCount,
    reads: group.sum.readRequests,
    writes: group.sum.writeRequests,
  };
};
