import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/backend/db";
import { signToken } from "@/backend/auth";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/auth/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        try {
          // Check if user already exists
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!dbUser) {
            // Create a bare user — role is PATIENT by default
            // The doctor can link them to a patient profile later
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                passwordHash: "GOOGLE_OAUTH_NO_PASSWORD",
                role: "PATIENT",
              },
            });
          }

          // Build our JWT and attach to user object for the jwt callback
          const token = signToken({
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
          });

          (user as any)._appToken = token;
          (user as any)._appRole = dbUser.role;
          (user as any)._appId = dbUser.id;

          return true;
        } catch (e) {
          console.error("Google signIn DB error:", e);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        if ((user as any)._appToken) token.appToken = (user as any)._appToken;
        if ((user as any)._appRole) token.appRole = (user as any)._appRole;
        if ((user as any)._appId) token.appId = (user as any)._appId;
      }
      return token;
    },

    async session({ session, token }) {
      (session as any).appToken = token.appToken;
      (session as any).appRole = token.appRole;
      (session as any).appId = token.appId;
      return session;
    },

    async redirect({ url, baseUrl }) {
      return `${baseUrl}/api/auth/google-callback`;
    },
  },
});

export { handler as GET, handler as POST };
