import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";

export const authOptions: NextAuthOptions = {
  debug: true,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Email или Username", type: "text" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        console.log("⏳ Авторизация через BACKEND (Credentials)...");
        const res = await fetch(`${process.env.BACKEND_URL}/api/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Ошибка входа");
        }

        const { token, user } = await res.json();
        if (!user || !token) {
          throw new Error("Не удалось получить данные пользователя (Credentials)");
        }

        console.log("✅ Авторизация (Credentials) успешна, возвращаем user...");
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          accessToken: token,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user) return false;

      if (account?.provider === "google") {
        const res = await fetch(`${process.env.BACKEND_URL}/api/oauth/google/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
          }),
        });

        if (!res.ok) {
          console.error("Ошибка при checkGoogleUser:", await res.text());
          return false;
        }

        const data = await res.json();

        if (!data.found) {
          return "/complete-profile?email=" + encodeURIComponent(user.email as string) + "&name=" + encodeURIComponent(user.name as string);
        }

        // Обогащаем объект user данными из БД
        user.id = data.user.id;
        user.username = data.user.username;
        user.avatar = data.user.avatar;
        return true;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.avatar = user.avatar;
        token.accessToken = user.accessToken;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.username = token.username as string;
      session.user.avatar = token.avatar as string;
      session.user.accessToken = token.accessToken as string;
      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,

  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  events: {
    async signOut() {
      console.log("⏳ Выход из системы, удаляем токен...");
      const cookieStore = await cookies();
      await cookieStore.set("token", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
        path: "/",
      });
      console.log("✅ Токен удален");
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
