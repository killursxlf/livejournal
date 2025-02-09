"use client";

import { useState} from "react";
import { useSession, signIn } from "next-auth/react";

export default function Login() {
  const { data: session } = useSession(); // Текущая сессия

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  console.log("session:", session );


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // signIn - вызываем провайдера "credentials"
    // ОБЯЗАТЕЛЬНО указываем redirect: false,
    // чтобы NextAuth НЕ делал автоматический редирект
    const result = await signIn("credentials", {
      redirect: false,
      identifier, // то, что ждет бэкенд
      password,
    });

    setLoading(false);

    if (result?.error) {
      // Если есть ошибка, показываем
      setError(result.error || "Ошибка входа");
      return;
    }

    // Если ошибки нет, NextAuth обновит сессию в фоне → useSession() 
    // → при появлении session.user.username сработает useEffect
    console.log("Логин успешен, ждем обновления сессии...");
  };


  //
  // 3. Вёрстка формы
  //
  return (
    <div className="container mx-auto p-6 max-w-md">
      <h1 className="text-3xl font-bold text-center">Вход</h1>

      {error && <p className="text-red-500 text-center mt-2">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-4">
        <input
          type="text"
          placeholder="Email или @username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="block w-full p-2 border rounded mb-2"
          required
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full p-2 border rounded mb-2"
          required
        />

        <button
          type="submit"
          className="bg-blue-600 text-white p-2 rounded w-full"
          disabled={loading}
        >
          {loading ? "Входим..." : "Войти"}
        </button>

        {/* Google OAuth */}
        <button
          type="button"
          onClick={() => signIn("google", { redirect: false })}
          className="bg-red-500 text-white p-2 rounded w-full my-2"
          disabled={loading}
        >
          Войти через Google
        </button>

        <p className="mt-4 text-center">
          Нет аккаунта?{" "}
          <a href="/register" className="text-blue-600">
            Зарегистрироваться
          </a>
        </p>
      </form>
    </div>
  );
}
