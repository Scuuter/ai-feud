import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../../.env.local") });

const requiredEnvVars = ["LM_STUDIO_URL"] as const;
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const LM_STUDIO_URL = process.env.LM_STUDIO_URL!;
export const MODEL_SMALL_PARALLEL =
  process.env.MODEL_SMALL_PARALLEL ?? "hermes-3-llama-3.1-8b-lorablated";
export const MODEL_LARGE_REASONING =
  process.env.MODEL_LARGE_REASONING ?? "google/gemma-4-26b-a4b";
export const CONCURRENCY_LIMIT = parseInt(
  process.env.CONCURRENCY_LIMIT ?? "8",
  10,
);
export const REDUCE_CHUNK_SIZE = parseInt(
  process.env.REDUCE_CHUNK_SIZE ?? "10",
  10,
);
export const MAX_RETRIES = parseInt(process.env.MAX_RETRIES ?? "3", 10);
export const DATA_DIR = path.join(__dirname, "../../data");
export const OUTPUT_DIR = path.join(__dirname, "../output");
export const OUTPUT_RAW_DIR = path.join(OUTPUT_DIR, "raw");
