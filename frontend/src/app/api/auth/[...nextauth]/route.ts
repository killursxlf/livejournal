import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { cookies } from "next/headers";

/**
 * ВАЖНО: Вам нужно в .env 
 *   NEXTAUTH_SECRET=<random_string>
 *   BACKEND_URL=http://localhost:3000  (или ваш адрес)
 */

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
        // 1. Отправляем запрос на бэкенд для логина по паролю
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
          accessToken: token,
        };
      },
    }),
  ],

  callbacks: {
    /**
     * signIn – вызывается при ЛЮБОЙ авторизации (и Google, и Credentials).
     * Здесь мы можем проверить user и решить, куда/как идти дальше.
     * Если вернём строку, будет редирект на неё.
     * Если вернём true/false, то либо разрешим вход, либо нет.
     */
    async signIn({ user, account, profile }) {
      if (!user) return false;
    
      // Если вход через Google
      if (account?.provider === "google") {
        // 1. Запрашиваем Bun-сервер, проверяем наличие пользователя
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
          // Прерываем вход
          return false;
        }
    
        const data = await res.json();
        if (!data.found) {
  
          return "/complete-profile?email=" + encodeURIComponent(user.email as string) + "&name=" + encodeURIComponent(user.name as string);
        }
        // Юзер найден -> просто разрешаем вход
        return true;
      }
    
      // Если вход не через Google, просто разрешаем
      return true;
    },
    

    // jwt – сохраняем данные из user в токен (JWT)
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.accessToken = user.accessToken;
      }
      return token;
    },

    // session – переносим данные из токена в session
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
