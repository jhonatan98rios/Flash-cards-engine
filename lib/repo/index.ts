import { jsonRepo } from "./json";
import { mongoRepo } from "./mongo";
import type { TopicRepo } from "./types";

// MONGODB_URI set → MongoDB; otherwise the JSON-file dev fallback.
export const repo: TopicRepo = process.env.MONGODB_URI
  ? mongoRepo
  : (() => {
      console.warn(
        "[study] MONGODB_URI not set — using data/db.json as the data store"
      );
      return jsonRepo;
    })();
