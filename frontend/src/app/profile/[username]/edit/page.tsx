"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function EditProfile() {
  const { username } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState(""); // ✅ Добавили name
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (username) {
      fetch(`http://localhost:3000/api/user?username=${username}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            setUser(data);
            setName(data.name || ""); // ✅ Загружаем name из БД
            setBio(data.bio || "");
          }
        })
        .catch(() => setError("Ошибка загрузки профиля"));
    }
  }, [username]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Имя не может быть пустым!");
      return;
    }

    const res = await fetch("http://localhost:3000/api/update-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, name, bio }), // ✅ Отправляем name
    });

    if (res.ok) {
      alert("✅ Профиль обновлён!");
      router.push(`/profile/${username}`);
    } else {
      const data = await res.json();
      setError(data.error || "Ошибка при обновлении профиля");
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatar) return;

    const formData = new FormData();
    formData.append("avatar", avatar);
    formData.append("email", user.email);

    const res = await fetch("http://localhost:3000/api/upload-avatar", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (res.ok) {
      alert("✅ Аватар обновлён!");
      router.push(`/profile/${username}`);
    } else {
      setError(data.error || "Ошибка при загрузке аватара");
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Загрузка...</p>;

  return (
    <div className="container mx-auto p-6 max-w-lg">
      <h1 className="text-3xl font-bold mb-4">Редактирование профиля</h1>

      <label className="block font-medium">Имя:</label>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded mb-2"
        autoFocus // ✅ Автофокус на поле имени
        required
      />

      <label className="block font-medium">О себе:</label>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <button onClick={handleSave} className="mt-2 bg-blue-600 text-white p-2 rounded w-full">
        Сохранить
      </button>

      <label className="block mt-4 font-medium">Загрузить аватар:</label>
      <input
        type="file"
        onChange={(e) => setAvatar(e.target.files?.[0] || null)}
        className="border p-2 w-full"
      />
      <button onClick={handleAvatarUpload} className="mt-2 bg-green-600 text-white p-2 rounded w-full">
        Загрузить
      </button>
    </div>
  );
}
