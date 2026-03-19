import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import { getMongoClient } from "@/lib/auth-mongodb-client";
import { connectDB } from "@/lib/mongodb";
import User from "@/lib/models/user.model";
import type { UserRole } from "@/domain/types";

/**
 * NextAuth.js v5 configuration for magic-link authentication.
 *
 * Key decisions:
 * - Email provider sends a magic link (no password)
 * - MongoDB adapter stores sessions, tokens, and accounts
 * - Only pre-registered, active users can sign in
 * - Session includes user role and database ID for authorization checks
 * - Session strategy is "database" for persistent 90-day sessions
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(getMongoClient()),
  session: {
    strategy: "database",
    maxAge: 90 * 24 * 60 * 60, // 90 days
  },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login/error",
  },
  callbacks: {
    /**
     * Controls whether a user is allowed to sign in.
     * Only pre-existing, active users in our Users collection can access the app.
     */
    async signIn({ user }) {
      if (!user.email) return false;

      await connectDB();
      const dbUser = await User.findOne({
        email: user.email.toLowerCase(),
        isActive: true,
      }).lean();

      return !!dbUser;
    },

    /**
     * Enriches the session object with user role and database ID
     * so that authorization checks can be performed on the client and server.
     */
    async session({ session, user }) {
      if (user?.email) {
        await connectDB();
        const dbUser = await User.findOne({
          email: user.email.toLowerCase(),
        }).lean();

        if (dbUser) {
          session.user.id = dbUser._id.toString();
          session.user.role = dbUser.role as UserRole;
          session.user.name = dbUser.name;
        }
      }

      return session;
    },
  },
});
