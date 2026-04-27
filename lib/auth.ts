import { getServerSession } from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;

        const valid = await bcryptjs.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: String(user.id), email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.userId = parseInt((user as any).id);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).userId = token.userId;
      }
      return session;
    },
  },
  pages: { signIn: "/admin/login" },
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
};

export function getSession() {
  return getServerSession(authOptions);
}

export type Role = "ADMIN1" | "ADMIN2";

export type AuthResult =
  | { ok: true; userId: number; role: Role }
  | { ok: false; status: 401 | 403; error: string };

/**
 * Require that a request carries a valid session.
 * If `role` is provided, also require that the session has that role.
 * Returns a discriminated union so callers can early-return with proper HTTP.
 */
export async function requireAuth(role?: Role): Promise<AuthResult> {
  const session = await getSession();
  const user = session?.user as { role?: Role; userId?: number } | undefined;

  if (!session || !user?.role || typeof user.userId !== "number") {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  if (role && user.role !== role) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, userId: user.userId, role: user.role };
}
