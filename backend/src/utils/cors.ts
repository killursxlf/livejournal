export function corsHeaders() {
    return {
      "Access-Control-Allow-Origin": "*", // ✅ Разрешаем все источники
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    };
}
  