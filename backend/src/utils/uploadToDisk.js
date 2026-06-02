import { join, parse } from "path";
import fs from "fs/promises";

// ensure uploads directory
const uploadsDir = join(process.cwd(), "uploads");
await fs.mkdir(uploadsDir).catch(() => {});

export const uploadToDisk = async ({ key, buffer }) => {
  try {
    const { dir, base } = parse(key);

    if (dir) {
      await fs
        .mkdir(join(uploadsDir, dir), { recursive: true })
        .catch(() => {});
    }

    console.log(key)
    await fs.writeFile(join(uploadsDir, key), buffer);

    console.log("Successfully uploaded file to disk to avoid network errors");
    return `http://localhost:${process.env.PORT}/uploads/${key}`;
  } catch (err) {
    console.log("Error uploading file to disk:", err.message);
    throw err;
  }
};
