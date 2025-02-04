import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { User as NextAuthUser, Session } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string;
      email?: string;
      image?: string;
      username?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }: { user: NextAuthUser }) {
      const res = await fetch(`http://localhost:3000/api/user?email=${user.email}`);
      const existingUser = await res.json();

      if (existingUser.error) {
        return `/complete-profile?email=${user.email}&name=${user.name}`;
      }

      return true;
    },

    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      return url.startsWith(baseUrl) ? url : baseUrl;
    },

    async session({ session }: { session: Session }) {
      if (session.user) { 
        const res = await fetch(`http://localhost:3000/api/user?email=${session.user.email}`);
        const user = await res.json();

        if (!user.error) {
          session.user.id = user.id;
          session.user.username = user.username;
        }
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
