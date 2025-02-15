import prisma from "../prisma";
import { corsHeaders } from "../utils/cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { verifyToken } from "./auth";
import fs from "fs/promises";

export async function getUser(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");
  const username = url.searchParams.get("username");
  const currentUserId = url.searchParams.get("userId");

  if (!email && !username) {
    return new Response(
      JSON.stringify({ error: "Необходимо указать email или username" }),
      {
        status: 400,
        headers: corsHeaders(),
      }
    );
  }

  const whereCondition = email
    ? { email }
    : username
    ? { username: username as string }
    : undefined;

  if (!whereCondition) {
    return new Response(
      JSON.stringify({ error: "Некорректный запрос" }),
      {
        status: 400,
        headers: corsHeaders(),
      }
    );
  }

  try {
    // Загружаем пользователя с его постами и отношениями подписок
    const user = await prisma.user.findUnique({
      where: whereCondition,
      include: {
        posts: {
          include: {
            postTags: { include: { tag: true } },
            likes: { select: { userId: true } },
            comments: {
              include: {
                user: {
                  select: { username: true, name: true, avatar: true },
                },
              },
            },
            savedBy: true, // связь сохранённых постов
          },
        },
        followers: true,
        following: true,
      },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Пользователь не найден" }),
        {
          status: 404,
          headers: corsHeaders(),
        }
      );
    }

    // Если передан currentUserId, вычисляем для профиля, подписан ли он на данного пользователя
    const isFollow = currentUserId
      ? user.followers.some(
          (follow: { followerId: string }) => follow.followerId === currentUserId
        )
      : false;

    // Функция для маппинга поста в нужный формат
    const mapPost = (post: any) => {
      // Если у поста есть собственный автор (для понравившихся/сохранённых постов), используем его,
      // иначе - это посты, созданные самим пользователем.
      const author = post.author || {
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      };

      const basePost = {
        id: post.id,
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        author: {
          username: author.username,
          name: author.name,
          avatar: author.avatar,
        },
        postTags: post.postTags.map((pt: { tag: { name: string } }) => ({
          tag: { name: pt.tag.name },
        })),
        likeCount: post.likes.length,
        commentCount: post.comments.length,
        comments: post.comments.map((comment: any) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          author: {
            username: comment.user?.username || "Unknown",
            name: comment.user?.name || "Unknown",
            avatar: comment.user?.avatar,
          },
        })),
      };

      if (currentUserId) {
        return {
          ...basePost,
          isLiked: post.likes.some(
            (like: { userId: string }) => like.userId === currentUserId
          ),
          isSaved: post.savedBy.some(
            (saved: { userId: string }) => saved.userId === currentUserId
          ),
        };
      }
      return basePost;
    };

    // Посты, созданные пользователем
    const createdPosts = user.posts.map(mapPost);

    // Получаем посты, которые пользователь лайкнул (могут быть не его собственными)
    const likedPostsData = await prisma.post.findMany({
      where: {
        likes: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        author: { select: { username: true, name: true, avatar: true } },
        postTags: { include: { tag: true } },
        likes: { select: { userId: true } },
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

    const likedPosts = likedPostsData.map(mapPost);

    // Получаем посты, которые пользователь сохранил
    const savedPostsData = await prisma.post.findMany({
      where: {
        savedBy: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        author: { select: { username: true, name: true, avatar: true } },
        postTags: { include: { tag: true } },
        likes: { select: { userId: true } },
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

    const savedPosts = savedPostsData.map(mapPost);

    const result = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt, // Дата регистрации
      followerCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0,
      isFollow,
      posts: createdPosts,
      likedPosts,
      savedPosts,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(),
      },
    });
  } catch (err) {
    console.error("Ошибка при getUser:", err);
    return new Response(JSON.stringify({ error: "Ошибка сервера" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

export async function getCurrentUser(req: Request) {
  try {
    // Получаем заголовок с куками
    const cookieHeader = req.headers.get("Cookie");
    if (!cookieHeader) {
      return new Response(JSON.stringify({ error: "Не авторизован" }), { status: 401 });
    }

    // Парсим куки и достаём токен
    const cookies = Object.fromEntries(cookieHeader.split("; ").map(c => c.split("=")));
    const token = cookies["token"];

    if (!token) {
      return new Response(JSON.stringify({ error: "Не авторизован" }), { status: 401 });
    }

    // Проверяем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    return new Response(JSON.stringify(decoded), { status: 200 });
  } catch (error) {
    console.error("Ошибка получения пользователя:", error);

    // Проверяем, является ли error экземпляром Error
    const errorMessage = error instanceof Error ? error.message : "Ошибка сервера";

    return new Response(JSON.stringify({ error: errorMessage }), { status: 401 });
  }
}


export async function completeProfile(req: Request) {
  try {
    const { email, name, username, password } = await req.json();

    if (!email || !username || !password) {
      return new Response(JSON.stringify({ error: "Все поля обязательны" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // Проверяем, что username не занят
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "Этот @username уже занят" }),
        {
          status: 400,
          headers: corsHeaders(),
        }
      );
    }

    // Ищем пользователя по email
    let user = await prisma.user.findUnique({ where: { email } });

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    if (user) {
      // Обновляем существующего пользователя
      user = await prisma.user.update({
        where: { email },
        data: {
          name,
          username,
          password: hashedPassword, // <-- сохраняем хеш
        },
      });
    } else {
      // Создаём нового пользователя
      user = await prisma.user.create({
        data: {
          email,
          name,
          username,
          password: hashedPassword, // <-- сохраняем хеш
        },
      });
    }

    return new Response(
      JSON.stringify({ message: "Регистрация завершена", user }),
      {
        headers: corsHeaders(),
      }
    );
  
  } catch (error) {
    console.error("Ошибка завершения регистрации:", error);
    return new Response(JSON.stringify({ error: "Ошибка завершения регистрации" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}


export async function updateProfile(req: Request): Promise<Response> {
  try {
    // Проверка токена
    const tokenData = await verifyToken(req);
    console.log("Token Data:", tokenData);
    const tokenEmail = tokenData?.user?.email || tokenData?.email;
    
    if (!tokenEmail) {
      return new Response(
        JSON.stringify({ error: "Не авторизован" }),
        { status: 401, headers: corsHeaders() }
      );
    }

    // Собираем данные для обновления в объект updateData
    const updateData: { 
      email?: string;
      name?: string; 
      bio?: string; 
      username?: string; 
      avatar?: string 
    } = {};
    
    let email: string | null = null;
    let avatarFile: File | null = null;

    const contentType = req.headers.get("Content-Type") || "";
    if (contentType.includes("multipart/form-data")) {
      // Если данные отправляются в форме (с файлом аватара)
      const formData = await req.formData();
      email = formData.get("email") as string | null;
      const name = formData.get("name") as string | null;
      const bio = formData.get("bio") as string | null;
      const newUsername = formData.get("username") as string | null;
      avatarFile = formData.get("avatar") as File | null;

      if (email) updateData.email = email;
      if (name) updateData.name = name;
      if (bio) updateData.bio = bio;
      if (newUsername) updateData.username = newUsername;
    } else {
      // Если данные отправляются как JSON
      const body = await req.json();
      email = body.email;
      if (body.name !== undefined) updateData.name = body.name;
      if (body.bio !== undefined) updateData.bio = body.bio;
      if (body.username !== undefined) updateData.username = body.username;
      if (body.email !== undefined) updateData.email = body.email;
    }

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ error: "Email обязателен" }),
        { status: 400, headers: corsHeaders() }
      );
    }

    // Сверяем email из запроса с email из токена
    if (email !== tokenEmail) {
      return new Response(
        JSON.stringify({ error: "Доступ запрещён" }),
        { status: 403, headers: corsHeaders() }
      );
    }

    // Если файл аватара передан, обрабатываем его:
    if (avatarFile && avatarFile instanceof File) {
      // Получаем текущего пользователя из БД для удаления старой аватарки
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.avatar && existingUser.avatar.startsWith("http://localhost:3000")) {
        try {
          // Извлекаем путь файла из URL (например, http://localhost:3000/uploads/avatar_123.png)
          const oldUrl = new URL(existingUser.avatar);
          const oldFilePath = `./public${oldUrl.pathname}`;
          // Удаляем старый файл (если существует)
          await fs.unlink(oldFilePath);
        } catch (err) {
          console.error("Ошибка удаления старого файла аватара:", err);
          // Если удаление не удалось, можно продолжить, но логируем ошибку
        }
      }

      // Генерируем новое имя файла и путь
      const fileExtension = avatarFile.name.split(".").pop();
      const fileName = `avatar_${Date.now()}.${fileExtension}`;
      const filePath = `/uploads/${fileName}`;

      // Записываем новый файл в папку public
      await Bun.write(`./public${filePath}`, avatarFile);
      // Обновляем поле avatar с новым URL
      updateData.avatar = `http://localhost:3000${filePath}`;
    }

    if (!Object.keys(updateData).length) {
      return new Response(
        JSON.stringify({ error: "Нет данных для обновления" }),
        { status: 400, headers: corsHeaders() }
      );
    }

    await prisma.user.update({
      where: { email },
      data: updateData,
    });

    return new Response(
      JSON.stringify({ message: "Профиль обновлён", ...updateData }),
      { headers: corsHeaders() }
    );
  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
    return new Response(
      JSON.stringify({ error: "Ошибка обновления профиля" }),
      { status: 500, headers: corsHeaders() }
    );
  }
}
  
export async function getUserWithPosts(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");

    if (!username) {
      return new Response(
        JSON.stringify({ error: "Username обязателен" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        posts: {
          include: {
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
        },
        // Предполагается, что вы реализовали отношения через модель Follows
        followers: true,
        following: true,
      },
    });

    if (!user) {
      return new Response(
        JSON.stringify({ error: "Пользователь не найден" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders() },
        }
      );
    }

    const postsWithExtraFields = user.posts.map((post) => ({
      id: post.id,
      title: post.title,
      content: post.content,
      createdAt: post.createdAt,
      // Автор поста — это сам пользователь, найденный по username
      author: {
        username: user.username,
        name: user.name,
        avatar: user.avatar,
      },
      postTags: post.postTags.map((pt: { tag: { name: string } }) => ({
        tag: { name: pt.tag.name },
      })),
      likeCount: post.likes ? post.likes.length : 0,
      commentCount: post.comments ? post.comments.length : 0,
      comments: post.comments
        ? post.comments.map((comment) => ({
            id: comment.id,
            content: comment.content,
            createdAt: comment.createdAt,
            author: {
              username: comment.user?.username || "Unknown",
              name: comment.user?.name || "Unknown",
              avatar: comment.user?.avatar,
            },
          }))
        : [],
    }));

    const result = {
      id: user.id,
      username: user.username,
      name: user.name,
      bio: user.bio,
      email: user.email,
      avatar: user.avatar,
      createdAt: user.createdAt, // Дата регистрации
      followerCount: user.followers ? user.followers.length : 0,
      followingCount: user.following ? user.following.length : 0,
      posts: postsWithExtraFields,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders() },
    });
  } catch (err) {
    console.error("Ошибка при getUserWithPosts:", err);
    return new Response(JSON.stringify({ error: "Ошибка сервера" }), {
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
      return new Response(JSON.stringify({ error: "Не авторизован" }), {
        status: 401,
        headers: corsHeaders(),
      });
    }

    const { title, content, email, tags } = await req.json();

    if (!title || !content || !email) {
      return new Response(JSON.stringify({ error: "Все поля обязательны" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // Проверяем, что email из запроса совпадает с email из токена
    if (email !== tokenEmail) {
      return new Response(JSON.stringify({ error: "Доступ запрещён" }), {
        status: 403,
        headers: corsHeaders(),
      });
    }

    // Находим пользователя по email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return new Response(JSON.stringify({ error: "Пользователь не найден" }), {
        status: 404,
        headers: corsHeaders(),
      });
    }

    const tagsData = (tags || []).map((tagName: string) => ({
      tag: {
        connectOrCreate: {
          where: { name: tagName.toLowerCase() },
          create: { name: tagName.toLowerCase() },
        },
      },
    }));

    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: user.id,
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
    return new Response(JSON.stringify({ error: "Ошибка создания поста" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}