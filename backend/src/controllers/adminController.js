import fs from "fs/promises";
import path from "path";

export const getGeneratedFiles = async (req, res) => {
  try {
    const generatedDir = path.resolve(process.cwd(), "generated");

    await fs.mkdir(generatedDir, { recursive: true });
    const entries = await fs.readdir(generatedDir, { withFileTypes: true });

    const files = entries
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);

    return res.json({
      success: true,
      data: files,
    });
    
  } catch (err) {
    console.error("Failed to read ./generated directory:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to read generated directory",
    });
  }
};
