import { MongoClient, type Db } from "mongodb";
import type { Topic } from "../types";
import type { TopicRepo } from "./types";

// ponytail: single lazy client, one embedded doc per topic. Separate
// collections per item type only if topic documents ever get huge.
let dbPromise: Promise<Db> | null = null;

function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const uri = process.env.MONGODB_URI;
      if (!uri) throw new Error("MONGODB_URI is not set");
      const client = new MongoClient(uri);
      await client.connect();
      return client.db(process.env.MONGODB_DB ?? "study-engine");
    })();
    void dbPromise.catch(() => {
      dbPromise = null; // allow a later retry after a transient failure
    });
  }
  return dbPromise;
}

type TopicDoc = Omit<Topic, "id"> & { _id: string };

const toTopic = ({ _id, ...rest }: TopicDoc): Topic => ({ id: _id, ...rest });

export const mongoRepo: TopicRepo = {
  async listTopics() {
    const docs = await (await getDb())
      .collection<TopicDoc>("topics")
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    return docs.map(toTopic);
  },
  async getTopic(id) {
    const doc = await (await getDb())
      .collection<TopicDoc>("topics")
      .findOne({ _id: id });
    return doc ? toTopic(doc) : null;
  },
  async saveTopic(topic) {
    const { id, ...rest } = topic;
    await (await getDb())
      .collection<TopicDoc>("topics")
      .updateOne({ _id: id }, { $set: rest }, { upsert: true });
  },
  async deleteTopic(id) {
    await (await getDb()).collection<TopicDoc>("topics").deleteOne({ _id: id });
  },
};
