import mongoose from "mongoose";

/**
 * MongoDB connection utility.
 *
 * Uses a cached connection to avoid creating multiple connections
 * during hot-reloads in development or across serverless function
 * invocations in production (Vercel).
 *
 * @throws {Error} If MONGODB_URI environment variable is not set.
 */

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Returns a cached Mongoose connection. Creates a new connection
 * on the first call and reuses it on subsequent calls.
 *
 * @returns The Mongoose instance with an active connection.
 * @throws {Error} If MONGODB_URI environment variable is not set.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined. Please add it to your environment variables."
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
