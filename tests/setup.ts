/**
 * Global test setup for Vitest.
 *
 * Starts an in-memory MongoDB instance before all tests
 * and tears it down when all tests finish.
 * Sets the MONGODB_URI environment variable so the app's
 * connectDB() picks up the test database automatically.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  process.env.MONGODB_URI = uri;

  // Stub auth-related env vars to prevent module-level throws
  process.env.AUTH_SECRET = "test-secret";
  process.env.AUTH_URL = "http://localhost:3000";
});

afterEach(async () => {
  // Clean all collections between tests for isolation
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});
