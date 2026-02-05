import fs from "fs";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");

// Check if .env exists
if (!fs.existsSync(envPath)) {
  const defaultEnv = "";

  fs.writeFileSync(envPath, defaultEnv, "utf8");
  console.log(".env file created with default values.");
} else {
  console.log(".env already exists, skipping creation.");
}
