import prisma from "../prisma";
import { corsHeaders } from "../utils/cors"; 

export async function register(req: Request) {
  try {
    const { email, name = "", username, password } = await req.json();

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return new Response(JSON.stringify({ error: "Email или @username уже заняты" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    const newUser = await prisma.user.create({
      data: { email, name, username, password },
    });

    return new Response(JSON.stringify({ message: "Регистрация успешна", user: newUser }), {
      headers: corsHeaders(),
    });
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    return new Response(JSON.stringify({ error: "Ошибка регистрации" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

export async function login(req: Request) {
  try {
    const { identifier, password } = await req.json();

    const user = await prisma.user.findFirst({
      where: { OR: [{ email: identifier }, { username: identifier }] },
    });

    if (!user || user.password !== password) {
      return new Response(JSON.stringify({ error: "Неверный email, @username или пароль" }), {
        status: 401,
        headers: corsHeaders(),
      });
    }

    return new Response(JSON.stringify({ token: "fake-jwt-token", user }), {
      headers: corsHeaders(),
    });
  } catch (error) {
    console.error("Ошибка входа:", error);
    return new Response(JSON.stringify({ error: "Ошибка входа" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}
