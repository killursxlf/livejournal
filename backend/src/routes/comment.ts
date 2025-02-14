// src/controllers/commentController.ts
import { PrismaClient } from "@prisma/client";
import { corsHeaders } from "../utils/cors";
import { verifyToken } from "./auth";
const prisma = new PrismaClient();

export async function addComment(req: Request): Promise<Response> {
  console.log("Функция addComment запущена");
  try {
    const tokenData = await verifyToken(req);
    console.log("Token Data in addComment:", tokenData);
    const tokenUserId = tokenData?.user?.id || tokenData?.id;
    if (!tokenUserId) {
      return new Response(
        JSON.stringify({ error: "Не авторизован" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    // Извлекаем данные из тела запроса
    const { content, postId, userId } = await req.json();
    console.log("Request body in addComment:", { content, postId, userId });

    if (!content || !postId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    // Проверяем, что userId из запроса совпадает с идентификатором из токена
    if (userId !== tokenUserId) {
      return new Response(
        JSON.stringify({ error: "Доступ запрещён" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    // Создаем комментарий с привязкой к посту и пользователю
    const comment = await prisma.comment.create({
      data: {
        content,
        post: { connect: { id: postId } },
        user: { connect: { id: userId } },
      },
      include: {
        user: {
          select: { username: true, name: true, avatar: true },
        },
      },
    });

    // Переименовываем поле user в author
    const commentWithAuthor = {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      author: comment.user,
    };

    console.log("Созданный комментарий:", commentWithAuthor);

    return new Response(JSON.stringify(commentWithAuthor), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (error) {
    console.error("Ошибка в addComment:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
}

export async function DELETE(req: Request, context: { params: { id: string } }) {
  try {
    // Извлекаем идентификатор комментария из параметров URL (это UUID)
    const { id: commentId } = context.params;
    if (!commentId) {
      return new Response(
        JSON.stringify({ error: "Идентификатор комментария не указан" }),
        { status: 400 }
      );
    }

    // Проверяем авторизацию: получаем токен из кук, используя вашу функцию verifyToken
    const token = await verifyToken(req);
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Пользователь не авторизован" }),
        { status: 401 }
      );
    }

    // Находим комментарий и включаем данные поста (для проверки, кто является создателем поста)
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true },
    });

    if (!comment) {
      return new Response(
        JSON.stringify({ error: "Комментарий не найден" }),
        { status: 404 }
      );
    }

    // Разрешаем удаление, если пользователь является либо автором комментария, либо автором поста
    if (comment.userId !== token.id && comment.post.authorId !== token.id) {
      return new Response(
        JSON.stringify({ error: "Нет прав для удаления этого комментария" }),
        { status: 403 }
      );
    }

    // Удаляем комментарий
    await prisma.comment.delete({
      where: { id: commentId },
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("Ошибка при удалении комментария:", error);
    return new Response(
      JSON.stringify({ error: "Ошибка при удалении комментария" }),
      { status: 500 }
    );
  }
}
