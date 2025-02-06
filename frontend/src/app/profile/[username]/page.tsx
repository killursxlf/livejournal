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

  // 👉 Новые поля для создания поста
  const [showCreatePostForm, setShowCreatePostForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState(""); // Теги, введённые через запятую
  const [postError, setPostError] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);

  useEffect(() => {
    if (username) {
      const decodedUsername = decodeURIComponent(username as string);

      fetch(`http://localhost:3000/api/user?username=${decodedUsername}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            setError(data.error);
          } else {
            // Добавляем полный URL к аватарке, если он относительный
            if (data.avatar && !data.avatar.startsWith("http")) {
              data.avatar = `http://localhost:3000${data.avatar}`;
            }

            setUser(data);

            // Сравниваем session.user.email и data.email
            if (session?.user?.email === data.email) {
              setIsOwner(true);
            }
          }
        })
        .catch(() => setError("Ошибка загрузки профиля"));
    }
  }, [username, session]);

  // 👉 Открытие/закрытие контейнера для создания поста
  const handleToggleCreatePostForm = () => {
    setShowCreatePostForm((prev) => !prev);
  };

  // 👉 Обработчик отправки формы
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPost(true);
    setPostError("");

    if (!session?.user?.email) {
      setPostError("Вы не авторизованы");
      setCreatingPost(false);
      return;
    }

    try {
      // Разбиваем строку "react, nextjs" на массив тегов
      // Можно trim() + filter, чтобы убрать пробелы/пустые элементы
      const tagsArray = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      const res = await fetch("http://localhost:3000/api/create-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          email: session.user.email, // автор
          tags: tagsArray, // если сервер ожидает массив тегов
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPostError(data.error || "Ошибка создания поста");
      } else {
        // Пост успешно создан, обновляем список постов на экране
        const newPost = data.post;
        setUser((prev: any) => ({
          ...prev,
          posts: [newPost, ...(prev.posts || [])],
        }));
        // Сброс полей формы
        setTitle("");
        setContent("");
        setTagsInput("");
        setShowCreatePostForm(false);
      }
    } catch (err) {
      setPostError("Ошибка сети при создании поста");
    } finally {
      setCreatingPost(false);
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Загрузка...</p>;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-4">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt="Аватар"
            className="w-24 h-24 rounded-full border object-cover"
          />
        ) : (
          <div className="w-24 h-24 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-gray-600">Нет фото</span>
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold">{user.name || user.username}</h1>
          <p className="text-sm text-gray-500">@{user.username}</p>
          <p className="text-gray-600 mt-2">{user.bio || "Нет описания"}</p>
        </div>
      </div>

      {isOwner && (
        <div className="mt-4">
          <Link href={`/profile/${username}/edit`}>
            <button className="bg-blue-600 text-white px-4 py-2 rounded">
              Edit Profile
            </button>
          </Link>

          {/* Кнопка "Создать пост" */}
          <button
            onClick={handleToggleCreatePostForm}
            className="ml-4 bg-green-600 text-white px-4 py-2 rounded"
          >
            Создать пост
          </button>

          {/* Если showCreatePostForm = true -> показываем форму */}
          {showCreatePostForm && (
            <div className="mt-6 bg-gray-100 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">Новый пост</h2>
              {postError && <p className="text-red-500 mb-2">{postError}</p>}
              <form onSubmit={handleCreatePost}>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Заголовок"
                  className="block w-full p-2 border rounded mb-2"
                  required
                />
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Содержание..."
                  className="block w-full p-2 border rounded mb-2"
                  rows={4}
                  required
                />
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Теги (через запятую)"
                  className="block w-full p-2 border rounded mb-2"
                />
                <button
                  type="submit"
                  disabled={creatingPost}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  {creatingPost ? "Опубликовываем..." : "Опубликовать пост"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <h2 className="text-2xl font-semibold mt-6">Публикации</h2>
      {user.posts?.length > 0 ? (
        <div className="mt-4">
          {user.posts.map((post: any) => (
            <div key={post.id} className="border p-4 rounded mt-2">
              <h3 className="text-lg font-bold">{post.title}</h3>
              <p>{post.content}</p>
              {/* Если на бэкенде реализованы теги, можно вывести */}
              {post.postTags?.length > 0 && (
                <div className="mt-1 text-sm text-gray-600">
                  Теги:{" "}
                  {post.postTags.map((pt: any) => pt.tag.name).join(", ")}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mt-4">Пока нет публикаций.</p>
      )}
    </div>
  );
}
