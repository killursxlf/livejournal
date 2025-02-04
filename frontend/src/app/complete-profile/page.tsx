"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CompleteProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const nameFromGoogle = searchParams.get("name");

  const [name, setName] = useState(nameFromGoogle || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!email) {
      router.push("/"); 
    }
  }, [email, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("http://localhost:3000/api/complete-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, username, password }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push("/posts");
    } else {
      setError(data.error || "Ошибка завершения регистрации");
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Завершение регистрации</h1>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit} className="mt-4">
        <input
          type="text"
          placeholder="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full p-2 border rounded mb-2"
          required
        />
        <input
          type="text"
          placeholder="@username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="block w-full p-2 border rounded mb-2"
          required
        />
        <input
          type="password"
          placeholder="Придумайте пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full p-2 border rounded mb-2"
          required
        />
        <button type="submit" className="bg-green-600 text-white p-2 rounded">
          Завершить регистрацию
        </button>
      </form>
    </div>
  );
}
