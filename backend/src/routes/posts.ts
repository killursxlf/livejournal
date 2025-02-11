import prisma from "../prisma";
import { corsHeaders } from "../utils/cors";

export async function getAllPosts(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    const posts = await prisma.post.findMany({
      include: {
        author: { select: { username: true, name: true, email: true, avatar: true } },
        postTags: { include: { tag: true } },
        likes: true,
        comments: true,
      },
    });

    // При необходимости перемешиваем посты:
    posts.sort(() => Math.random() - 0.5);

    const postsWithExtraFields = posts.map((post) => {
      const basePost = {
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        author: {
          username: post.author.username,
          name: post.author.name,
          avatar: post.author.avatar,
        },
        postTags: post.postTags.map((pt) => ({ tag: { name: pt.tag.name } })),
        likeCount: post.likes.length,
        commentCount: post.comments.length,
      };

      if (userId) {
        return {
          ...basePost,
          isLiked: post.likes.some((like) => like.userId === userId),
        };
      }
      return basePost;
    });

    return new Response(JSON.stringify(postsWithExtraFields), {
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
