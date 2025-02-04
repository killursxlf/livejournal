import prisma from "../prisma";
import { corsHeaders } from "../utils/cors"; 

export async function getUser(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email");

  if (!email) {
    return new Response(JSON.stringify({ error: "Email обязателен" }), {
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

  return new Response(JSON.stringify(user), {
    headers: corsHeaders(),
  });
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

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
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
