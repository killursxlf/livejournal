import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route"; 

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await request.json();
  const { postId } = body;
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
  const payload = { postId, userId };

  // Получаем cookie из запроса и передаем её дальше
  const cookie = request.headers.get("cookie");

  try {
    const res = await fetch(`${backendURL}/api/like`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Ошибка в Next.js /api/like:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
