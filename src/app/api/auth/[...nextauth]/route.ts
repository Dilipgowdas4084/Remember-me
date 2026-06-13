import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/backend/db";
import { signToken } from "@/backend/auth";

export const authOptions = {
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
    async signIn({ user, account }: any) {
      if (account?.provider === "google" && user.email) {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                passwordHash: "GOOGLE_OAUTH_NO_PASSWORD",
                role: "PATIENT",
              },
            });
          }

          // Store our JWT + role in user object to pass into jwt callback
          (user as any)._appToken = signToken({
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
          });
          (user as any)._appRole = dbUser.role;

          return true;
        } catch (e) {
          console.error("Google signIn DB error:", e);
          return false;
        }
      }
      return true;
    },

    async jwt({ token, user }: any) {
      if (user?._appToken) {
        token.appToken = user._appToken;
        token.appRole = user._appRole;
      }
      return token;
    },

    async session({ session, token }: any) {
      session.appToken = token.appToken;
      session.appRole = token.appRole;
      return session;
    },

    // After Google login, redirect to our cookie-setter endpoint
    async redirect({ baseUrl }: any) {
      return `${baseUrl}/api/auth/set-cookie`;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
