/**
 * NextAuth configuration — Samanvay Intelligence
 * Credentials provider backed by Prisma User table.
 * JWT strategy carries role + assigned_lgd_code + assigned_ministry_id
 * so API routes can enforce RLS-equivalent scoping.
 */
import { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Government SSO",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "r.kumar@cabsec.gov.in" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await db.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: { ministry: true },
        });
        if (!user) return null;
        if (user.status !== "ACTIVE") return null;
        if (user.passwordHash !== credentials.password) return null; // plaintext for demo

        // Update lastActive
        await db.user.update({
          where: { id: user.id },
          data: { lastActive: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          assignedLgdCode: user.assignedLgdCode,
          assignedMinistryId: user.ministryId,
        } as any;
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 }, // 8h government session
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any;
        token.role = u.role;
        token.assignedLgdCode = u.assignedLgdCode;
        token.assignedMinistryId = u.assignedMinistryId;
        token.userId = u.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).assignedLgdCode = token.assignedLgdCode;
        (session.user as any).assignedMinistryId = token.assignedMinistryId;
        (session.user as any).id = token.userId;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "samanvay-dev-secret-change-in-production",
};

export type AppSession = {
  user: {
    id: string;
    email: string;
    name: string;
    role: "super_admin" | "central_executive" | "dept_nodal" | "district_magistrate" | "auditor";
    assignedLgdCode: number | null;
    assignedMinistryId: string | null;
  };
};
