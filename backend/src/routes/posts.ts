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
        postTags: post.postTags.map((pt: { tag: { name: string } }) => ({ tag: { name: pt.tag.name } })),
        likeCount: post.likes.length,
        commentCount: post.comments.length,
      };

      if (userId) {
        return {
          ...basePost,
          isLiked: post.likes.some((like: { userId: string }) => like.userId === userId),
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

export async function getPost(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const postId = url.searchParams.get("id");
    const userId = url.searchParams.get("userId");

    if (!postId) {
      return new Response(JSON.stringify({ error: "Missing post id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { username: true, name: true, email: true, avatar: true },
        },
        postTags: { include: { tag: true } },
        likes: true,
        comments: {
          include: {
            user: { // здесь используется связь "user", а не "author"
              select: { username: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!post) {
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    const postWithExtraFields = {
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
      comments: post.comments.map((comment) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        author: {
          username: comment.user.username,
          name: comment.user.name,
          avatar: comment.user.avatar,
        },
      })),
      ...(userId ? { isLiked: post.likes.some((like) => like.userId === userId) } : {}),
    };

    return new Response(JSON.stringify(postWithExtraFields), {
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (err) {
    console.error("Ошибка в getPost:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
}

