import { serve } from "bun";
import { register, login } from "./routes/auth";
import { getUser, completeProfile } from "./routes/user";
import { corsHeaders } from "./utils/cors"; 
serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    // 📌 CORS для всех запросов
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    if (url.pathname === "/api/register" && req.method === "POST")
      return register(req);
    if (url.pathname === "/api/login" && req.method === "POST") return login(req);
    if (url.pathname === "/api/user" && req.method === "GET") return getUser(req);
    if (url.pathname === "/api/complete-profile" && req.method === "POST")
      return completeProfile(req);

    return new Response("Страница не найдена", { status: 404, headers: corsHeaders() });
  },
});

console.log("🚀 Bun API работает на http://localhost:3000");
