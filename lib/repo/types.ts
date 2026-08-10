import type { Topic } from "../types";

/**
 * Central data layer. Single-user today; when auth lands, the interface
 * methods grow an `owner` parameter and every backend filters on it.
 */
export interface TopicRepo {
  listTopics(): Promise<Topic[]>;
  getTopic(id: string): Promise<Topic | null>;
  saveTopic(topic: Topic): Promise<void>; // upsert by id
  deleteTopic(id: string): Promise<void>;
}
