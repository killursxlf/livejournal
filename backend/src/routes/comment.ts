// src/controllers/commentController.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function addComment(req: Request): Promise<Response> {
  try {
    const { content, postId, userId } = await req.json();

    if (!content || !postId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Создаем комментарий и включаем связанные данные пользователя (автора)
    const comment = await prisma.comment.create({
      data: {
        content,
        post: { connect: { id: postId } },
        user: { connect: { id: userId } },
      },
      include: {
        user: { 
          select: { 
            username: true, 
            name: true, 
            avatar: true 
          } 
        },
      },
    });

    // Переименовываем полученное поле user в author, чтобы фронтенд получил нужную структуру
    const commentWithAuthor = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: comment.user, // Здесь автор содержит username, name и avatar
    };

    return new Response(JSON.stringify(commentWithAuthor), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Ошибка в addComment:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


