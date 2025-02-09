"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRound, Mail } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { DateTime } from "next-auth/providers/kakao";

interface UserProfileData {
  avatar?: string;
  name?: string;
  username?: string;
  bio?: string;
  email?: string;
  location?: string;
  website?: string;
  stats?: {
    posts?: number;
    followers?: number;
    following?: number;
  };
  posts?: PostData[];
  error?: string;
}

interface PostData {
  id: string;
  title: string;
  content: string;
  author: string;
  postTags?: { tag: { name: string } }[];
  createdAt: DateTime;
}

export default function UserProfile() {
  const { username } = useParams();
  const { data: session } = useSession();
<<<<<<< HEAD
  const [user, setUser] = useState<any>(null);
=======

  const [user, setUser] = useState<UserProfileData | null>(null);
>>>>>>> b2f222c3cd0f67e052dcb0c734257ee92afe7f8f
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState("");

  // Состояния для создания поста
  const [showCreatePostForm, setShowCreatePostForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [postError, setPostError] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);

  useEffect(() => {
    if (username) {
      const decodedUsername = decodeURIComponent(username as string);
      fetch(`http://localhost:3000/api/user?username=${decodedUsername}`)
        .then((res) => res.json())
        .then((data: UserProfileData) => {
          if (data.error) {
            setError(data.error);
          } else {
            // Если аватар относительный, добавляем базовый URL
            if (data.avatar && !data.avatar.startsWith("http")) {
              data.avatar = `http://localhost:3000${data.avatar}`;
            }
<<<<<<< HEAD
            // Add a function for publish post, 
=======
>>>>>>> b2f222c3cd0f67e052dcb0c734257ee92afe7f8f
            setUser(data);
            if (session?.user?.email === data.email) {
              setIsOwner(true);
            }
          }
        })
        .catch(() => setError("Ошибка загрузки профиля"));
    }
  }, [username, session]);

  const handleToggleCreatePostForm = () => {
    setShowCreatePostForm((prev) => !prev);
  };

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
          email: session.user.email,
          tags: tagsArray,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPostError(data.error || "Ошибка создания поста");
      } else {
        const newPost: PostData = data.post;
        setUser((prev) =>
          prev ? { ...prev, posts: [newPost, ...(prev.posts || [])] } : prev
        );
        setTitle("");
        setContent("");
        setTagsInput("");
        setShowCreatePostForm(false);
      }
    } catch {
      setPostError("Ошибка сети при создании поста");
    } finally {
      setCreatingPost(false);
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Загрузка...</p>;

  return (
    <div className="container mx-auto p-6">
      {/* Заголовок профиля */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col md:flex-row items-center gap-8">
          {/* Аватарка – центрируем на малых экранах */}
          <div className="flex w-full md:w-auto justify-center">
            <Avatar className="w-24 h-24">
              {user.avatar ? (
                <AvatarImage src={user.avatar} alt={user.name || user.username} />
              ) : (
                <AvatarFallback>
                  <UserRound className="w-12 h-12" />
                </AvatarFallback>
              )}
            </Avatar>
          </div>
          {/* Информация о пользователе */}
          <div className="flex flex-col justify-between w-full">
            <div>
              {/* Отступ сверху для выравнивания */}
              <h1 className="text-2xl font-bold mt-6">
                {user.name || user.username}
              </h1>
              <p className="text-sm text-gray-500">@{user.username}</p>
              <p className="text-gray-600 mt-2">{user.bio || "Нет описания"}</p>
              <div className="mt-2 space-y-1 text-sm text-gray-500">
                {user.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                )}
              </div>
            </div>
            {/* Кнопка "Редактировать профиль" внизу блока */}
            {isOwner && (
              <div className="mt-4">
                <Link href={`/profile/${username}/edit`}>
                  <Button variant="outline" className="w-full md:w-auto">
                    Редактировать профиль
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Заголовок публикаций и кнопка "Создать пост" справа */}
      <div className="flex items-center justify-between mt-6">
        <h2 className="text-2xl font-semibold">Публикации</h2>
        {isOwner && (
          <Button onClick={handleToggleCreatePostForm}>
            Создать пост
          </Button>
        )}
      </div>
<<<<<<< HEAD
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
=======

      {/* Форма создания поста (только для владельца) */}
      {isOwner && showCreatePostForm && (
        <Card className="max-w-4xl mx-auto mt-4 bg-gray-800 shadow-lg">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2 text-white">Новый пост</h2>
            {postError && <p className="text-red-500 mb-2">{postError}</p>}
            <form onSubmit={handleCreatePost}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Заголовок"
                className="block w-full p-2 bg-gray-700 border border-gray-600 rounded mb-2 text-white placeholder-gray-400"
                required
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Содержание..."
                className="block w-full p-2 bg-gray-700 border border-gray-600 rounded mb-2 text-white placeholder-gray-400"
                rows={4}
                required
              />
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Теги (через запятую)"
                className="block w-full p-2 bg-gray-700 border border-gray-600 rounded mb-2 text-white placeholder-gray-400"
              />
              <Button
                type="submit"
                disabled={creatingPost}
                className="bg-primary/10 text-white px-4 py-2 rounded hover:bg-green-700 transition"
              >
                {creatingPost ? "Опубликовываем..." : "Опубликовать пост"}
              </Button>
            </form>
          </CardContent>
        </Card>
>>>>>>> b2f222c3cd0f67e052dcb0c734257ee92afe7f8f
      )}


      {/* Секция публикаций */}
      {user.posts && user.posts.length > 0 ? (
        <div className="mt-4 space-y-4">
          {user.posts.map((post: PostData) => (
            <PostCard
              key={post.id}
              id={post.id}
              title={post.title}
              content={post.content}
              author={{
                name: user.name || user.username || "Автор",
                avatar: user.avatar || "",
              }}
              createdAt={new Date(post.createdAt)}
              postTags={post.postTags || []}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 mt-4">Пока нет публикаций.</p>
      )}
    </div>
  );
}
