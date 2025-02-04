import { serve } from "bun";

serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/hello") {
      return new Response(
        JSON.stringify({ message: "Привет, это Bun API!" }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*", // Разрешаем CORS
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: "Страница не найдена" }),
      {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*", // Разрешаем CORS
        },
      }
    );
  },
});

console.log("🚀 Bun API запущен на http://localhost:3000");
