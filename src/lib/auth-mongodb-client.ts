import { MongoClient } from "mongodb";

/**
 * MongoDB client for NextAuth's MongoDB adapter.
 *
 * NextAuth's adapter requires a raw MongoClient (not Mongoose).
 * We use a separate cached client for this purpose.
 */

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "MONGODB_URI is not defined. Please add it to your environment variables."
  );
}

interface MongoClientCache {
  client: MongoClient | null;
  promise: Promise<MongoClient> | null;
}

declare global {
  var mongoClientCache: MongoClientCache | undefined;
}

const cached: MongoClientCache = global.mongoClientCache ?? {
  client: null,
  promise: null,
};

if (!global.mongoClientCache) {
  global.mongoClientCache = cached;
}

/**
 * Returns a cached MongoClient for the NextAuth adapter.
 *
 * @returns A connected MongoClient instance.
 */
export async function getMongoClient(): Promise<MongoClient> {
  if (cached.client) {
    return cached.client;
  }

  if (!cached.promise) {
    const client = new MongoClient(MONGODB_URI as string);
    cached.promise = client.connect();
  }

  cached.client = await cached.promise;
  return cached.client;
}
