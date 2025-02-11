// src/app/api/like/route.ts
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

  const payload = { postId, userId };

  try {
    const res = await fetch("http://localhost:3000/api/like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Ошибка в Next.js /api/like:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
