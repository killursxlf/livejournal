"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function UserProfile() {
  const { username } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (username) {
      const decodedUsername = decodeURIComponent(username as string);

      fetch(`http://localhost:3000/api/user?username=${decodedUsername}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            // ✅ Добавляем полный URL к аватарке, если он относительный
            if (data.avatar && !data.avatar.startsWith("http")) {
              data.avatar = `http://localhost:3000${data.avatar}`;
            }

            setUser(data);
            if (session?.user?.email === data.email) {
              setIsOwner(true);
            }
          }
        })
        .catch(() => setError("Ошибка загрузки профиля"));
    }
  }, [username, session]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Загрузка...</p>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-4">
        {user.avatar ? (
          <img src={user.avatar} alt="Аватар" className="w-24 h-24 rounded-full border object-cover" />
        ) : (
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600">Нет фото</span>
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{user.username}</h1>
          <p className="text-gray-600">{user.bio || "Нет описания"}</p>
        </div>
      </div>

      {isOwner && (
        <div className="mt-4">
          <Link href={`/profile/${username}/edit`}>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">Edit Profile</button>
          </Link>
        </div>
      )}

      <h2 className="text-2xl font-semibold mt-6">Публикации</h2>
      {user.posts?.length > 0 ? (
        <div className="mt-4">
          {user.posts.map((post: any) => (
            <div key={post.id} className="border p-4 rounded mt-2">
              <h3 className="text-lg font-bold">{post.title}</h3>
              <p>{post.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mt-4">Пока нет публикаций.</p>
      )}
    </div>
  );
}
