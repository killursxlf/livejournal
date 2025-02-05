"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState(""); // 👈 Добавлен username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // 👈 Для блокировки кнопки при загрузке

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password || !username) {
      setError("Все поля обязательны!");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 👈 Теперь куки будут работать
        body: JSON.stringify({ email, name: name || "", username, password }), // 👈 Отправляем username
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Ошибка регистрации");
      }

      alert("Регистрация успешна!");
      router.push("/login");
    } catch (err: any) {
      setError(err.message || "Ошибка сети");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <h1 className="text-3xl font-bold text-center">Регистрация</h1>
      {error && <p className="text-red-500 text-center mt-2">{error}</p>}
      <form onSubmit={handleSubmit} className="mt-4">
        <input
          type="text"
          placeholder="Имя (необязательно)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full p-2 border rounded mb-2"
        />
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="block w-full p-2 border rounded mb-2"
          required
        />
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
        <button
          type="submit"
          className="bg-green-600 text-white p-2 rounded w-full mt-2 disabled:bg-gray-400"
          disabled={loading} // 👈 Блокируем кнопку при загрузке
        >
          {loading ? "Регистрация..." : "Зарегистрироваться"}
        </button>
      </form>
      <p className="mt-4 text-center">
        Уже есть аккаунт? <a href="/login" className="text-blue-600">Войти</a>
      </p>
    </div>
  );
}
