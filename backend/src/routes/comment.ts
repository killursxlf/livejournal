import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function addComment(request: Request): Promise<Response> {
  try {
    const { postId, userId, content } = await request.json();

    // Создаём новый комментарий
    const newComment = await prisma.comment.create({
      data: { postId, userId, content },
    });

    return new Response(JSON.stringify(newComment), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Ошибка в addComment:", error);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
