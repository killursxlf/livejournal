"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [data, setData] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:3000/api/hello") // Должен быть правильный адрес Bun API
      .then((res) => res.json())
      .then((data) => setData(data.message))
      .catch((error) => console.error("Ошибка запроса:", error));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-5xl font-bold text-blue-600">Добро пожаловать в LiveJournal!</h1>
      <p className="text-lg text-gray-600 mt-4">{data ? data : "Загрузка данных..."}</p>
    </div>
  );
}
