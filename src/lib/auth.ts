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
 * - updateAge: 24h — la sesión se renueva una vez al día si el usuario está activo
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: MongoDBAdapter(getMongoClient()),
  session: {
    strategy: "database",
    maxAge: 90 * 24 * 60 * 60, // 90 días
    updateAge: 24 * 60 * 60,   // renovar sesión cada 24h
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
     * Controla si un usuario puede iniciar sesión.
     * Solo usuarios pre-registrados y activos tienen acceso.
     *
     * Devuelve la URL de error explícitamente en lugar de `false`
     * para garantizar la redirección correcta en NextAuth v5.
     * No se revela si el email existe o no (mensaje genérico).
     */
    async signIn({ user }) {
      if (!user.email) return "/login/error?error=AccessDenied";

      try {
        await connectDB();
        const dbUser = await User.findOne({
          email: user.email.toLowerCase(),
          isActive: true,
        }).lean();

        if (!dbUser) return "/login/error?error=AccessDenied";

        return true;
      } catch {
        return "/login/error?error=AccessDenied";
      }
    },

    /**
     * Enriquece la sesión con el ID de base de datos y el rol del usuario.
     * Permite realizar comprobaciones de autorización en cliente y servidor.
     *
     * Se consulta la BD en cada refresco de sesión para garantizar
     * que los datos reflejan el estado actual del usuario.
     */
    async session({ session, user }) {
      if (user?.email) {
        try {
          await connectDB();
          const dbUser = await User.findOne({
            email: user.email.toLowerCase(),
          }).lean();

          if (dbUser) {
            session.user.id = dbUser._id.toString();
            session.user.role = dbUser.role as UserRole;
            session.user.name = dbUser.name;
          }
        } catch {
          // Error no crítico: la sesión sigue siendo válida aunque falte enriquecimiento
        }
      }

      return session;
    },
  },
});
