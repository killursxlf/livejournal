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

  const [user, setUser] = useState<UserProfileData | null>(null);
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
