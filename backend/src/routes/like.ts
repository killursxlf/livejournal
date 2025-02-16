import { PrismaClient } from "@prisma/client";
import { corsHeaders } from "../utils/cors";
import { verifyToken } from "./auth";

const prisma = new PrismaClient();

export async function toggleLike(req: Request): Promise<Response> {
  try {
    const tokenData = await verifyToken(req);
    const tokenUserId = tokenData?.user?.id || tokenData?.id;
    if (!tokenUserId) {
      return new Response(
        JSON.stringify({ error: "Не авторизован" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    const { postId, userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    if (userId !== tokenUserId) {
      return new Response(
        JSON.stringify({ error: "Доступ запрещён" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders() } }
      );
    }

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: { postId, userId },
      },
    });

    if (existingLike) {
      await prisma.like.delete({ where: { id: existingLike.id } });
      const likeCount = await prisma.like.count({ where: { post: { id: postId } } });
      return new Response(JSON.stringify({ liked: false, likeCount }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    } else {
      await prisma.like.create({
        data: {
          post: { connect: { id: postId } },
          user: { connect: { id: userId } },
        },
      });
      const likeCount = await prisma.like.count({ where: { post: { id: postId } } });
      return new Response(JSON.stringify({ liked: true, likeCount }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }
  } catch (error) {
    console.error("Ошибка в toggleLike:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
}
