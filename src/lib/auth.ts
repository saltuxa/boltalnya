import { eq } from "drizzle-orm";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db/client";
import { ensureDatabase } from "@/db/init";
import { users } from "@/db/schema";
import { loginSchema } from "@/lib/validation";
import { verifyPassword } from "@/lib/passwords";

ensureDatabase();

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Логин и пароль",
      credentials: {
        username: { label: "Логин", type: "text" },
        password: { label: "Пароль", type: "password" }
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const profile = await db.query.users.findFirst({
          where: eq(users.username, parsed.data.username)
        });

        if (!profile || !verifyPassword(parsed.data.password, profile.passwordHash)) return null;

        return {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          image: profile.avatar,
          username: profile.username
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.picture = user.image;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.name = token.name ?? session.user.name;
        session.user.image = (token.picture as string | undefined) ?? session.user.image;
        session.user.username = token.username as string | undefined;
      }
      return session;
    }
  }
};
