import prisma from "../prisma";
import { corsHeaders } from "../utils/cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRATION = "7d"; // Токен на 7 дней

export async function register(req: Request) {
  try {
    const { email, name = "", username, password } = await req.json();

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser) {
      return new Response(JSON.stringify({ error: "Email или @username уже заняты" }), {
        status: 400,
        headers: corsHeaders(),
      });
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Создаём пользователя
    const newUser = await prisma.user.create({
      data: { email, name, username, password: hashedPassword },
    });

    // Генерируем JWT токен
    const token = jwt.sign({ id: newUser.id, email: newUser.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    });

    return new Response(JSON.stringify({ message: "Регистрация успешна", token, user: newUser }), {
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

    // Проверка пользователя: ищем по email или username
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
        ],
      },
    });

    if (!user || !user.password) {
      return new Response(
        JSON.stringify({ error: "Неверные данные" }),
        { status: 401 },
      );
    }

    // Проверка пароля
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Неверный пароль" }),
        { status: 401 },
      );
    }

    // Генерация JWT
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET не найден в .env");
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // ✅ Возвращаем JSON без Set-Cookie (пусть NextAuth управляет кукой)
    return new Response(
      JSON.stringify({
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          avatar: user.avatar,
          name: user.name,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Ошибка логина:", err);
    return new Response(
      JSON.stringify({ error: "Ошибка сервера" }),
      { status: 500 },
    );
  }
}


function parseCookies(req: Request): { [key: string]: string } {
  const cookieHeader = req.headers.get("cookie") || "";
  return cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, ...v] = cookie.split("=");
    if (key && v) {
      acc[key.trim()] = v.join("=").trim();
    }
    return acc;
  }, {} as { [key: string]: string });
}

export async function verifyToken(req: Request): Promise<any | null> {
  // Извлекаем куки из заголовка
  const cookies = parseCookies(req);
  // Создаем объект, который имитирует NextRequest, содержащий поле cookies
  const pseudoNextRequest = {
    cookies,
  };
  
  // Вызываем getToken, передавая созданный объект и секрет
  const token = await getToken({ req: pseudoNextRequest as any, secret: process.env.NEXTAUTH_SECRET });
  return token;
}

export async function logout(req: Request) {
  return new Response(JSON.stringify({ message: "Выход выполнен" }), {
    status: 200,
    headers: {
      "Set-Cookie": "token=; HttpOnly; Secure; Path=/; Max-Age=0",
      ...corsHeaders(),
    },
  });
}

export async function verifyUser(req: Request) {
  try {
    const { email } = await req.json();

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user) {
      return new Response(JSON.stringify({ error: "Пользователь не найден", reason: "NOT_FOUND" }), {
        status: 404,
        headers: corsHeaders(),
      });
    }

    return new Response(JSON.stringify({ id: user.id, email: user.email }), {
      status: 200,
      headers: corsHeaders(),
    });
  } catch (error) {
    console.error("Ошибка верификации пользователя:", error);
    return new Response(JSON.stringify({ error: "Ошибка сервера" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
}

export async function checkGoogleUser(req: Request) {
  try {
    const { email, name } = await req.json();

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      const { password, ...userData } = existingUser;
      return new Response(JSON.stringify({ found: true, user: userData }), {
        headers: { "Content-Type": "application/json" },
      });
    }


    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        username: "", 
        password: "", 
      },
    });

    return new Response(JSON.stringify({ found: false, userId: newUser.id }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Ошибка при checkGoogleUser:", err);
    return new Response(JSON.stringify({ error: "Ошибка сервера" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
