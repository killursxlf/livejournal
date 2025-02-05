import bcrypt from "bcryptjs";
import prisma from "../prisma"; // Подключаем Prisma

async function updatePasswords() {
  try {
    const users = await prisma.user.findMany({
      where: {
        NOT: [{ password: "" }], // ✅ Фильтруем пользователей, у которых пароль НЕ null
      },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });

    for (const user of users) {
      if (!user.password) continue; // ✅ Игнорируем пользователей без пароля

      const password = user.password as string; // ✅ Приводим к `string`

      if (!password.startsWith("$2a$")) {
        // Проверяем, хеширован ли пароль (bcrypt-хеш всегда начинается с "$2a$")
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
        console.log(`✅ Обновлён пароль для пользователя ${user.email}`);
      }
    }

    console.log("✅ Все старые пароли хешированы!");
  } catch (error) {
    console.error("🚨 Ошибка обновления паролей:", error);
  }
}

updatePasswords();
