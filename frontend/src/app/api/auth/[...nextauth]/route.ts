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
        console.log("⏳ Авторизация через BACKEND...");

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
          throw new Error("Не удалось получить данные пользователя");
        }

        console.log("✅ Авторизация успешна, передаем user в NextAuth...");

        // Возвращаем объект `user` — NextAuth сам выставит куку next-auth.session-token
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          accessToken: token,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * signIn – вызывается после успешной authorize, но до редиректа.
     * Если вернуть строку, будет редирект. Если true/false – нет редиректа.
     */
    async signIn({ user }) {
      if (!user) return false; // запрет входа
      console.log("▶ [signIn callback]: user =", user);

      // Возвращаем true – значит вход разрешен, но URL не возвращаем
      // => NextAuth НЕ будет делать автоматический редирект
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.accessToken = user.accessToken;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.username = token.username as string;
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

      // Пример очистки вашей отдельной куки (если используете)
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
