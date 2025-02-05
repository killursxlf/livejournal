export function corsHeaders() {
    return {
      "Access-Control-Allow-Origin": "http://localhost:3001", 
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Credentials": "true",
    };
}
  