"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem("token", data.token);
      router.push("/posts");
    } else {
      setError(data.error || "Ошибка входа");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Вход</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="mt-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        <button type="submit" className="bg-blue-600 text-white p-2 rounded">
          Войти
        </button>

        <button
        onClick={() => signIn("google", { callbackUrl: "/posts" })}
        className="bg-red-500 text-white p-2 rounded w-full my-2"
        >
            Войти через Google
        </button>

        <p className="mt-4">
            Нет аккаунта? <a href="/register" className="text-blue-600">Зарегистрироваться</a>
        </p>
      </form>
    </div>
  );
}
