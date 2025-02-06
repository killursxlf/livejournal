import prisma from "../prisma";
import { corsHeaders } from "../utils/cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


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


// Проверка JWT токена (защищённый маршрут)
export async function verifyToken(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Токен отсутствует" }), {
        status: 401,
        headers: corsHeaders(),
      });
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return new Response(JSON.stringify({ user: decoded }), {
        headers: corsHeaders(),
      });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Неверный или просроченный токен" }), {
        status: 401,
        headers: corsHeaders(),
      });
    }
  } catch (error) {
    console.error("Ошибка проверки токена:", error);
    return new Response(JSON.stringify({ error: "Ошибка сервера" }), {
      status: 500,
      headers: corsHeaders(),
    });
  }
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

    // Проверяем, есть ли пользователь с таким email
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // Юзер уже есть
      return new Response(JSON.stringify({ found: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Если нет, создаём новую запись. Пароль можно оставить пустым, 
    // или делать дополнительную логику
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        username: "",      
        password: "", 
      },
    });

    // Возвращаем found: false -> чтобы NextAuth сделал редирект на /complite-profile
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