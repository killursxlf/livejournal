"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

// Если у вас есть переменная окружения для URL бекенда, например, NEXT_PUBLIC_BACKEND_URL
const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export default function Header() {
  const { data: session } = useSession();

  let avatar = (session?.user as any)?.avatar || session?.user?.image;
  if (avatar && avatar.startsWith("/")) {
    avatar = `${backendURL}${avatar}`;
  }

  return (
    <header className="bg-blue-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-bold cursor-pointer">LiveJournal</h1>
        </Link>

        <nav>
          <ul className="flex space-x-4 items-center">
            <li>
              <Link href="/" className="hover:underline">
                Главная
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:underline">
                О проекте
              </Link>
            </li>

            {!session ? (
              <li>
                <button
                  onClick={() => signIn()}
                  className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100 transition"
                >
                  Войти
                </button>
              </li>
            ) : (
              <li className="flex items-center space-x-3">
                {avatar && (
                  <img
                    src={avatar}
                    alt="Аватар"
                    className="w-8 h-8 rounded-full border"
                  />
                )}
                <span>{session.user?.name || "Профиль"}</span>
                <button
                  onClick={() => signOut()}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-700 transition"
                >
                  Выйти
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  );
}
