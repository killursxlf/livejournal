import prisma from "../prisma";
import { corsHeaders } from "../utils/cors";

export async function getUser(req: Request) {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const username = url.searchParams.get("username");
  
    if (!email && !username) {
      return new Response(JSON.stringify({ error: "Необходимо указать email или username" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }
  
    // ✅ Фиксим ошибку - передаём только `string`, убираем `null`
    const whereCondition = email
      ? { email }
      : username
      ? { username: username as string } // 👈 Приводим к `string`
      : undefined;
  
    if (!whereCondition) {
      return new Response(JSON.stringify({ error: "Некорректный запрос" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }
  
    try {
      // ✅ Загружаем пользователя и его посты
      const user = await prisma.user.findUnique({
        where: whereCondition,
        include: { posts: true }, // 👈 Добавляем загрузку постов
      });
  
      if (!user) {
        return new Response(JSON.stringify({ error: "Пользователь не найден" }), {
          status: 404,
          headers: corsHeaders(),
        });
      }
  
      return new Response(JSON.stringify(user), {
        headers: corsHeaders(),
      });
    } catch (error) {
      console.error("Ошибка получения пользователя:", error);
      return new Response(JSON.stringify({ error: "Ошибка сервера" }), {
        status: 500,
        headers: corsHeaders(),
      });
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

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return new Response(JSON.stringify({ error: "Этот @username уже занят" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      user = await prisma.user.update({
        where: { email },
        data: { name, username, password },
      });
    } else {
      user = await prisma.user.create({
        data: { email, name, username, password },
      });
    }

    return new Response(JSON.stringify({ message: "Регистрация завершена", user }), {
      headers: corsHeaders(),
    });
  } catch (error) {
    console.error("Ошибка завершения регистрации:", error);
    return new Response(JSON.stringify({ error: "Ошибка завершения регистрации" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}


export async function updateProfile(req: Request) {
  try {
    const { email, bio } = await req.json();

    await prisma.user.update({
      where: { email },
      data: { bio },
    });

    return new Response(JSON.stringify({ message: "Профиль обновлён" }), {
      headers: corsHeaders(),
    });
  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
    return new Response(JSON.stringify({ error: "Ошибка обновления профиля" }), { status: 500 });
  }
}

export async function uploadAvatar(req: Request) {
    try {
      const formData = await req.formData();
      const file = formData.get("avatar");
      const email = formData.get("email");
  
      if (!file || !(file instanceof File)) {
        return new Response(JSON.stringify({ error: "Файл обязателен" }), {
          status: 400,
          headers: corsHeaders(),
        });
      }
  
      if (!email || typeof email !== "string") {
        return new Response(JSON.stringify({ error: "Email обязателен" }), {
          status: 400,
          headers: corsHeaders(),
        });
      }
  
      // ✅ Генерируем уникальное имя файла
      const fileExtension = file.name.split(".").pop();
      const fileName = `avatar_${Date.now()}.${fileExtension}`;
      const filePath = `/uploads/${fileName}`;
  
      // ✅ Сохраняем файл в `public/uploads/`, откуда сервер его раздаёт
      await Bun.write(`./public${filePath}`, file);
  
      // ✅ Обновляем ссылку на аватар в БД
      await prisma.user.update({
        where: { email },
        data: { avatar: `http://localhost:3000${filePath}` }, // ✅ Полный URL файла
      });
  
      return new Response(JSON.stringify({ avatarUrl: `http://localhost:3000${filePath}` }), {
        headers: corsHeaders(),
      });
    } catch (error) {
      console.error("Ошибка загрузки аватара:", error);
      return new Response(JSON.stringify({ error: "Ошибка загрузки" }), {
        status: 500,
        headers: corsHeaders(),
      });
    }
}
  

export async function getUserWithPosts(req: Request) {
    const url = new URL(req.url);
    const username = url.searchParams.get("username");
  
    if (!username) {
      return new Response(JSON.stringify({ error: "Username обязателен" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }
  
    const user = await prisma.user.findUnique({
      where: { username },
      include: { posts: true },
    });
  
    if (!user) {
      return new Response(JSON.stringify({ error: "Пользователь не найден" }), {
        status: 404,
        headers: corsHeaders(),
      });
    }
  
    return new Response(JSON.stringify(user), {
      headers: corsHeaders(),
    });
}

export async function createPost(req: Request) {
    try {
      const { title, content, email } = await req.json();
  
      if (!title || !content || !email) {
        return new Response(JSON.stringify({ error: "Все поля обязательны" }), {
          status: 400,
          headers: corsHeaders(),
        });
      }
  
      const user = await prisma.user.findUnique({ where: { email } });
  
      if (!user) {
        return new Response(JSON.stringify({ error: "Пользователь не найден" }), {
          status: 404,
          headers: corsHeaders(),
        });
      }
  
      const post = await prisma.post.create({
        data: { title, content, authorId: user.id },
      });
  
      return new Response(JSON.stringify({ message: "Публикация создана", post }), {
        headers: corsHeaders(),
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Ошибка создания поста" }), { status: 500 });
    }
}
