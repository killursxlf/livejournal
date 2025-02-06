// routes/posts.ts (пример)
import prisma from "../prisma";
import { corsHeaders } from "../utils/cors";

export async function getAllPosts(req: Request) {
  try {
    // 1. Берём все посты из базы
    let posts = await prisma.post.findMany({
        include: {
          author: {
            select: { username: true, name: true, email: true },
          },
          postTags: {
            include: {
              tag: true,
            },
          },
        },
    });
      

    posts = posts.sort(() => Math.random() - 0.5);

    return new Response(JSON.stringify(posts), {
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(),
      },
    });
  } catch (err) {
    console.error("Ошибка при getAllPosts:", err);
    return new Response(JSON.stringify({ error: "Ошибка сервера" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}
