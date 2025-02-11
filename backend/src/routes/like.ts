import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function toggleLike(request: Request): Promise<Response> {
  try {
    const { postId, userId } = await request.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Ошибка в toggleLike:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
