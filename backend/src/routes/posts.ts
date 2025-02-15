import prisma from "../prisma";
import { corsHeaders } from "../utils/cors";
import { verifyToken } from "./auth";

export async function getAllPosts(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const tag = url.searchParams.get("tag"); // фильтр по тегу
    const sortParam = url.searchParams.get("sort"); // сортировка: например, "popular" или "latest"
    const subscriptions = url.searchParams.get("subscriptions"); // фильтр подписок

    // Строим условие where
    const whereClause: any = {};
    if (tag) {
      // Фильтруем посты, у которых в связи postTags есть тег с указанным именем
      whereClause.postTags = {
        some: {
          tag: { name: tag },
        },
      };
    }

    // Если включен фильтр подписок и передан userId, то выбираем посты только от авторов,
    // на которых подписан текущий пользователь. Для этого проверяем наличие записи в связи followers
    // у автора, где followerId совпадает с userId.
    if (subscriptions === "true" && userId) {
      whereClause.author = {
        followers: {
          some: {
            followerId: userId,
          },
        },
      };
    }

    // Строим условие сортировки orderBy
    let orderByClause: any = {};
    if (sortParam === "popular") {
      // Сортировка по количеству лайков (используем возможность сортировки по _count)
      orderByClause = {
        likes: { _count: "desc" },
      };
    } else {
      // По умолчанию – сортировка по дате создания (от новых к старым)
      orderByClause = {
        createdAt: "desc",
      };
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy: orderByClause,
      include: {
        author: {
          select: { username: true, name: true, email: true, avatar: true, followers: true },
        },
        postTags: { include: { tag: true } },
        likes: true,
        comments: {
          include: {
            user: {
              select: { username: true, name: true, avatar: true },
            },
          },
        },
        // Включаем связь сохранённых постов
        savedBy: true,
      },
    });

    // Если параметр sort не указан, можно выполнить случайную сортировку (как вариант)
    if (!sortParam) {
      posts.sort(() => Math.random() - 0.5);
    }

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
        postTags: post.postTags.map((pt: { tag: { name: string } }) => ({
          tag: { name: pt.tag.name },
        })),
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
      };

      if (userId) {
        return {
          ...basePost,
          isLiked: post.likes.some(
            (like: { userId: string }) => like.userId === userId
          ),
          // Проверяем, есть ли запись в savedBy с данным userId
          isSaved: post.savedBy.some(
            (saved: { userId: string }) => saved.userId === userId
          ),
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

    if (!postId) {
      return new Response(JSON.stringify({ error: "Missing post id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // Используем вашу функцию verifyToken, которая уже использует parseCookies
    const tokenData = await verifyToken(req);
    // Приводим tokenData к any, чтобы безопасно извлечь id пользователя
    const userId: string | null = (tokenData as any)?.user?.id || (tokenData as any)?.id || null;

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
            user: {
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

    // Если userId получен, проверяем наличие лайка
    const isLiked = userId ? post.likes.some((like) => like.userId === userId) : false;

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
      isLiked,
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