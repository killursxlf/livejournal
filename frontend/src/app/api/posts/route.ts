// frontend/src/app/api/posts/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    // Получаем query-параметры из запроса
    const { searchParams } = new URL(request.url);
    // Пример: можно передать userId, если он есть в сессии на фронтенде
    const query = searchParams.toString();
    // Замените URL ниже на адрес вашего бэкенд‑API
    const backendURL = `http://localhost:3000/api/posts${query ? "?" + query : ""}`;

    const res = await fetch(backendURL);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Ошибка получения постов из backend:", error);
    return NextResponse.json({ error: "Ошибка сервера" }, { status: 500 });
  }
}
