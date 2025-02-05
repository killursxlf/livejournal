import { serve } from "bun";
import { register, login, logout, verifyToken, verifyUser, checkGoogleUser  } from "./routes/auth";
import { createPost, getUser, completeProfile, updateProfile, uploadAvatar } from "./routes/user";
import { corsHeaders } from "./utils/cors";
import { readFile } from "fs/promises";

serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // ✅ Обрабатываем CORS перед любым другим запросом
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          ...corsHeaders(),
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // ✅ Статическая раздача изображений
    if (url.pathname.startsWith("/uploads/")) {
      try {
        const filePath = `./public${url.pathname}`;
        const file = await readFile(filePath);
        return new Response(file, {
          headers: { "Content-Type": "image/jpeg", ...corsHeaders() },
        });
      } catch (error) {
        return new Response("Файл не найден", { status: 404, headers: corsHeaders() });
      }
    }

    try {
      // 🟢 Публичные маршруты (не требуют авторизации)
      if (url.pathname === "/api/register" && req.method === "POST") return register(req);
      if (url.pathname === "/api/login" && req.method === "POST") return login(req);
      if (url.pathname === "/api/logout" && req.method === "POST") return logout(req);
      if (url.pathname === "/api/complete-profile" && req.method === "POST") return completeProfile(req);
      if (url.pathname === "/api/user/verify" && req.method === "POST") return verifyUser(req);
      if (url.pathname === "/api/oauth/google/check" && req.method === "POST") return checkGoogleUser(req);

      // 🔐 Защищённые маршруты (проверка JWT)
      const user = await verifyToken(req);
      if (!user) {
        return new Response(JSON.stringify({ error: "Не авторизован" }), {
          status: 401,
          headers: corsHeaders(),
        });
      }

      if (url.pathname === "/api/user" && req.method === "GET") return getUser(req);
      if (url.pathname === "/api/update-profile" && req.method === "POST") return updateProfile(req);
      if (url.pathname === "/api/upload-avatar" && req.method === "POST") return uploadAvatar(req);
      if (url.pathname === "/api/create-post" && req.method === "POST") return createPost(req);

      return new Response("Страница не найдена", { status: 404, headers: corsHeaders() });
    } catch (error) {
      console.error("Ошибка на сервере:", error);
      return new Response(JSON.stringify({ error: "Ошибка сервера" }), {
        status: 500,
        headers: corsHeaders(),
      });
    }
  },
});

console.log("🚀 Bun API работает на http://localhost:3000");
