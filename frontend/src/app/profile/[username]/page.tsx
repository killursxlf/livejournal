"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRound, Mail } from "lucide-react";
import { PostCard } from "@/components/PostCard";

// Типы данных для пользователя и поста
interface UserProfileData {
  avatar?: string;
  name?: string;
  username?: string;
  bio?: string;
  email?: string;
  posts?: PostData[];
  error?: string;
}

interface PostData {
  id: string;
  title: string;
  content: string;
  author: string;
  postTags?: { tag: { name: string } }[];
  createdAt: string; // либо Date, если вы производите преобразование
}

export default function UserProfile() {
  const { username } = useParams();
  const router = useRouter();
  const { data: session } = useSession();
<<<<<<< HEAD
  const [user, setUser] = useState<any>(null);
=======

  const [user, setUser] = useState<UserProfileData | null>(null);
>>>>>>> b2f222c3cd0f67e052dcb0c734257ee92afe7f8f
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState("");

  // Флаг монтированности
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (username) {
      const decodedUsername = decodeURIComponent(username as string);
      fetch(`http://localhost:3000/api/user?username=${decodedUsername}`)
        .then((res) => res.json())
        .then((data: UserProfileData) => {
          if (!isMounted.current) return;
          if (data.error) {
            setError(data.error);
          } else {
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
        .catch(() => {
          if (isMounted.current) setError("Ошибка загрузки профиля");
        });
    }
    return () => {
      isMounted.current = false;
    };
  }, [username, session]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Загрузка...</p>;

  return (
    <div className="container mx-auto p-6">
      {/* Заголовок профиля */}
      <Card className="max-w-4xl mx-auto">
        <CardContent className="flex flex-col md:flex-row items-center gap-8">
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
          <div className="flex flex-col justify-between w-full">
            <div>
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

      {/* Заголовок публикаций и кнопка "Создать пост" */}
      <div className="flex items-center justify-between mt-6">
        <h2 className="text-2xl font-semibold">Публикации</h2>
        {isOwner && (
          <Button
            onClick={() => router.push(`/profile/${username}/create-post`)}
          >
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

<<<<<<< HEAD
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


=======
>>>>>>> 37b1c4fae0fdcb40a127e55b420b7691a37385ef
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
