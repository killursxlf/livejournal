import prisma from "../prisma";
import { corsHeaders } from "../utils/cors";
import { verifyToken } from "./auth";

export async function getAllPosts(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const tag = url.searchParams.get("tag"); // фильтр по тегу
    const sortParam = url.searchParams.get("sort"); // сортировка: "popular" или "latest"
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

    // Если включен фильтр подписок и передан userId, выбираем посты только от авторов,
    // на которых подписан текущий пользователь
    if (subscriptions === "true" && userId) {
      whereClause.author = {
        followers: {
          some: {
            followerId: userId,
          },
        },
      };
    }

    // Добавляем условие: исключаем посты со статусом DRAFT и возвращаем только посты, у которых publishAt <= сейчас
    whereClause.AND = [
      { status: { not: "DRAFT" } },
      { publishAt: { lte: new Date() } },
    ];

    // Строим условие сортировки orderBy
    let orderByClause: any = {};
    if (sortParam === "popular") {
      orderByClause = {
        likes: { _count: "desc" },
      };
    } else {
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
        savedBy: true,
      },
    });

    // Если параметр sort не указан, можно выполнить случайную сортировку
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
    console.log("Запрошенный postId:", postId);

    if (!postId) {
      console.error("Отсутствует postId в запросе");
      return new Response(JSON.stringify({ error: "Missing post id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // Проверяем токен из куки
    const tokenData = await verifyToken(req);
    console.log("Данные токена:", tokenData);
    const currentUserId: string | null = tokenData?.id || null;
    console.log("currentUserId:", currentUserId);

    // Находим пост с учетом всех отношений, включая версии
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: { id: true, username: true, name: true, email: true, avatar: true },
        },
        postTags: { include: { tag: true } },
        likes: { select: { userId: true } },
        comments: {
          include: {
            user: {
              select: { username: true, name: true, avatar: true },
            },
          },
        },
        savedBy: { select: { userId: true } },
        postVersions: true,
      },
    });
    console.log("Найденный пост:", post);

    if (!post) {
      console.error("Пост не найден");
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // Если пост является черновиком, разрешаем доступ только автору
    if (post.status === "DRAFT" && post.author.id !== currentUserId) {
      console.warn(
        `Доступ к черновику запрещён. post.author.id: ${post.author.id}, currentUserId: ${currentUserId}`
      );
      return new Response(JSON.stringify({ error: "Post not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // Проверяем, поставил ли текущий пользователь лайк или сохранил пост
    const isLiked = currentUserId
      ? post.likes.some((like) => like.userId === currentUserId)
      : false;
    const isSaved = currentUserId
      ? post.savedBy.some((saved) => saved.userId === currentUserId)
      : false;

    // Включаем версии поста только если запрашивает автор
    const postVersions =
      currentUserId && post.author.id === currentUserId
        ? post.postVersions.map((version) => ({
            id: version.id,
            title: version.title,
            content: version.content,
            editorId: version.editorId,
            createdAt: version.createdAt,
          }))
        : [];

    // Формируем объект с актуальными данными поста согласно текущей схеме
    const postWithExtraFields = {
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      status: post.status,
      publicationType: post.publicationType,
      publishAt: post.publishAt,
      author: {
        id: post.author.id,
        username: post.author.username,
        name: post.author.name,
        email: post.author.email,
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
      isSaved,
      postVersions, // версии включаются только для автора
    };

    console.log("Формируемый объект поста для клиента:", postWithExtraFields);

    return new Response(JSON.stringify(postWithExtraFields), {
      status: 200,
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

export async function createPost(req: Request) {
  try {
    // Извлекаем данные токена
    const tokenData = await verifyToken(req);
    const tokenEmail = tokenData?.user?.email || tokenData?.email;
    if (!tokenEmail) {
      return new Response(
        JSON.stringify({ error: "Не авторизован" }),
        { status: 401, headers: corsHeaders() }
      );
    }

    const {
      title,
      content,
      email,
      tags,
      status,           // Ожидается, например, "DRAFT" или "PUBLISHED"
      publicationType,  // Ожидается, например, "ARTICLE", "NEWS" или "REVIEW"
      publishDate,      // Ожидается в формате YYYY-MM-DD (опционально)
      publishTime,      // Ожидается в формате HH:MM (опционально)
    } = await req.json();

    if (!title || !content || !email) {
      return new Response(
        JSON.stringify({ error: "Все поля обязательны" }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // Проверяем, что email из запроса совпадает с email из токена
    if (email !== tokenEmail) {
      return new Response(
        JSON.stringify({ error: "Доступ запрещён" }),
        { status: 403, headers: corsHeaders() }
      );
    }

    // Находим пользователя по email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Пользователь не найден" }),
        { status: 404, headers: corsHeaders() }
      );
    }

    const tagsData = (tags || []).map((tagName: string) => ({
      tag: {
        connectOrCreate: {
          where: { name: tagName.toLowerCase() },
          create: { name: tagName.toLowerCase() },
        },
      },
    }));

    // Определяем окончательный статус поста
    const finalStatus = status || "DRAFT";

    // Формируем дату публикации
    let publishAt: Date | undefined;
    if (publishDate) {
      // Если время не указано, используем 00:00
      const timeStr = publishTime ? publishTime : "00:00";
      publishAt = new Date(`${publishDate}T${timeStr}:00`);
    } else if (finalStatus !== "DRAFT") {
      // Если publishDate не передан, а пост не является черновиком,
      // то публикация должна быть мгновенной
      publishAt = new Date();
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: user.id,
        status: finalStatus,
        publicationType: publicationType || "ARTICLE",
        ...(publishAt ? { publishAt } : {}),
        postTags: { create: tagsData },
      },
      include: {
        postTags: { include: { tag: true } },
      },
    });

    return new Response(
      JSON.stringify({ message: "Публикация создана", post }),
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error("Ошибка создания поста:", error);
    return new Response(
      JSON.stringify({ error: "Ошибка создания поста" }),
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function updateDraft(req: Request): Promise<Response> {
  try {
    // Проверяем токен из куки
    const tokenData = await verifyToken(req);
    const currentUserId: string | null =
      tokenData?.user?.id || tokenData?.id || tokenData?.sub || null;
    if (!currentUserId) {
      return new Response(JSON.stringify({ error: "Не авторизован" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // Получаем данные из запроса. Теперь ожидаем поле status.
    const {
      id,
      title,
      content,
      tags, // предполагается, что теги приходят как массив строк
      publicationType,
      publishDate,
      publishTime,
      status, // новый статус, например "DRAFT" или "PUBLISHED"
    } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing post id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // Находим существующий пост
    const existingPost = await prisma.post.findUnique({
      where: { id },
    });
    if (!existingPost) {
      return new Response(JSON.stringify({ error: "Пост не найден" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // Проверяем, что автор поста соответствует текущему пользователю
    if (existingPost.authorId !== currentUserId) {
      return new Response(JSON.stringify({ error: "Доступ запрещён" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      });
    }

    // Сохраняем старую версию поста в таблицу postVersions
    await prisma.postVersion.create({
      data: {
        postId: existingPost.id,
        title: existingPost.title,
        content: existingPost.content,
        editorId: currentUserId,
      },
    });

    // Формируем дату публикации, если переданы publishDate и publishTime
    let publishAt: Date | undefined;
    if (publishDate) {
      const timeStr = publishTime ? publishTime : "00:00:00";
      publishAt = new Date(`${publishDate}T${timeStr}`);
    }
    // Если статус "PUBLISHED" и дата не передана, устанавливаем publishAt на текущую дату
    if (status === "PUBLISHED" && !publishAt) {
      publishAt = new Date();
    }

    // Обратный мэппинг для преобразования значения publicationType из UI в значение для БД
    const publicationTypeMapping: Record<string, string> = {
      "Article": "ARTICLE",
      "News": "NEWS",
      "Review": "REVIEW",
    };

    // Обновляем пост с новыми данными, включая новый статус
    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title,
        content,
        publicationType:
          publicationTypeMapping[publicationType as keyof typeof publicationTypeMapping] ||
          publicationType,
        publishAt,
        status, // обновляем статус поста
        // Если нужно обновить теги, удаляем старые и создаём новые записи
        postTags: {
          deleteMany: {},
          create: tags.map((tagName: string) => ({
            tag: {
              connectOrCreate: {
                where: { name: tagName.toLowerCase() },
                create: { name: tagName.toLowerCase() },
              },
            },
          })),
        },
      },
      include: {
        author: {
          select: { id: true, username: true, name: true, email: true, avatar: true },
        },
        postTags: { include: { tag: true } },
      },
    });

    return new Response(
      JSON.stringify({ message: "Черновик обновлён", post: updatedPost }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    );
  } catch (error) {
    console.error("Ошибка обновления черновика:", error);
    return new Response(JSON.stringify({ error: "Ошибка сервера" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  }
}

export async function deletePost(req: Request): Promise<Response> {
  try {
    // Проверяем токен
    const tokenData = await verifyToken(req);
    const currentUserId = tokenData?.user?.id || tokenData?.sub || null;
    if (!currentUserId) {
      return new Response(
        JSON.stringify({ error: "Не авторизован" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }

    // Извлекаем postId из URL
    const url = new URL(req.url);
    const postId = url.searchParams.get("id");
    if (!postId) {
      return new Response(
        JSON.stringify({ error: "Отсутствует идентификатор поста" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }

    // Находим пост
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });
    if (!existingPost) {
      return new Response(
        JSON.stringify({ error: "Пост не найден" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }

    // Проверяем, что автор поста совпадает с текущим пользователем
    if (existingPost.authorId !== currentUserId) {
      return new Response(
        JSON.stringify({ error: "Доступ запрещён" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }

    // Удаляем связанные записи:
    await prisma.postTag.deleteMany({
      where: { postId },
    });
    await prisma.like.deleteMany({
      where: { postId },
    });
    await prisma.comment.deleteMany({
      where: { postId },
    });
    // Если у вас используется модель для сохраненных постов
    await prisma.savedPost.deleteMany({
      where: { postId },
    });
    // Удаляем версии поста
    await prisma.postVersion.deleteMany({
      where: { postId },
    });

    // Удаляем сам пост
    await prisma.post.delete({
      where: { id: postId },
    });

    return new Response(
      JSON.stringify({ message: "Пост успешно удален" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    );
  } catch (error) {
    console.error("Ошибка при удалении поста:", error);
    return new Response(
      JSON.stringify({ error: "Ошибка сервера" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders() },
      }
    );
  }
}