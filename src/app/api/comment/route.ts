import { NextResponse } from "next/server";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export async function POST(request: Request) {
  try {
    console.log("Next.js роут /api/comment: Получен запрос");
    const body = await request.json();
    console.log("Next.js роут /api/comment: Тело запроса", body);

    const cookie = request.headers.get("cookie");

    const res = await fetch(`${backendURL}/api/comment`, {
      method: "POST",
      credentials: "include", 
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(body),
    });

    console.log("Next.js роут /api/comment: Ответ от backend получен");
    const data = await res.json();
    console.log("Next.js роут /api/comment: Данные от backend", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Ошибка в Next.js роуте /api/comment:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
