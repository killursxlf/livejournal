import prisma from "../prisma";
import { corsHeaders } from "../utils/cors";
import { verifyToken } from "./auth";

export async function toggleFollow(req: Request): Promise<Response> {
  try {
    // Проверяем токен и получаем id пользователя из него
    const tokenData = await verifyToken(req);
    const tokenUserId = tokenData?.user?.id || tokenData?.id;
    if (!tokenUserId) {
      return new Response(
        JSON.stringify({ error: "Не авторизован" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }

    // Извлекаем данные из тела запроса: followingId – пользователь, на которого подписываемся,
    // userId – идентификатор текущего пользователя, который отправляет запрос
    const { followingId, userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }

    // Проверяем, что userId из запроса совпадает с id из токена
    if (userId !== tokenUserId) {
      return new Response(
        JSON.stringify({ error: "Доступ запрещён" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }

    // Предотвращаем подписку на самого себя
    if (userId === followingId) {
      return new Response(
        JSON.stringify({ error: "Нельзя подписаться на самого себя" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }

    // Проверяем, существует ли уже запись подписки
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      // Если подписка существует, удаляем её (отписка)
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId,
          },
        },
      });

      // Получаем обновлённое количество подписчиков для followingId
      const followerCount = await prisma.follows.count({
        where: { followingId },
      });

      return new Response(
        JSON.stringify({ followed: false, followerCount }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    } else {
      // Если подписки нет, создаем её (подписка)
      await prisma.follows.create({
        data: {
          followerId: userId,
          followingId,
        },
      });

      const followerCount = await prisma.follows.count({
        where: { followingId },
      });

      return new Response(
        JSON.stringify({ followed: true, followerCount }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }
  } catch (error) {
    console.error("Ошибка в toggleFollow:", error);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    );
  }
}
