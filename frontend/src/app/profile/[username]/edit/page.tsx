"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface User {
  email: string;
  name?: string;
  bio?: string;
}

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export default function EditProfile() {
  const { username } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState(""); 
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState("");
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (username) {
      fetch(`${backendURL}/api/user?username=${username}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted.current) return;
          if (data.error) {
            setError(data.error);
          } else {
            setUser(data);
            setName(data.name || ""); 
            setBio(data.bio || "");
          }
        })
        .catch(() => setError("Ошибка загрузки профиля"));
    }
    return () => {
      isMounted.current = false;
    };
  }, [username]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Имя не может быть пустым!");
      return;
    }

    const res = await fetch(`${backendURL}/api/update-profile`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user?.email, name, bio }), 
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
    if (user) {
      formData.append("email", user.email);
    }

    const res = await fetch(`${backendURL}/api/upload-avatar`, {
      method: "POST",
      credentials: "include",
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
        autoFocus 
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
