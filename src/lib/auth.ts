// path: src/lib/auth.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcrypt";
import { getServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (!session.user || !token.sub) return session;

      const user = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { id: true, email: true, name: true },
      });

      if (user) {
        (session.user as typeof session.user & { id: string }).id = user.id;
        session.user.email = user.email;
        session.user.name = user.name;
      } else {
        (session.user as typeof session.user & { id?: string }).id = token.sub;
      }

      return session;
    },
  },
  pages: { signIn: "/auth/login" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export const auth = () => getServerSession(authOptions);
