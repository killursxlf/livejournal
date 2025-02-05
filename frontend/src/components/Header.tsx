"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  const { data: session } = useSession();

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

            {/* ✅ Если пользователь НЕ авторизован → показываем "Войти" */}
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
              // ✅ Если пользователь авторизован → показываем "Выйти" и аватар
              <li className="flex items-center space-x-3">
                {session.user?.image && (
                  <img
                    src={session.user.image}
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
