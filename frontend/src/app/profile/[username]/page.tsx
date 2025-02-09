"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { EditorState, convertToRaw } from "draft-js";
import draftToHtml from "draftjs-to-html";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRound, Mail } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { DateTime } from "next-auth/providers/kakao";

const TextEditor = dynamic(() => import("@/components/TextEditor"), { ssr: false });

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

  const [user, setUser] = useState<UserProfileData | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState("");

  // Флаг, отслеживающий, смонтирован ли компонент
  const isMounted = useRef(true);

  // Состояния для создания поста
  const [showCreatePostForm, setShowCreatePostForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<EditorState>(EditorState.createEmpty());
  const [tagsInput, setTagsInput] = useState("");
  const [postError, setPostError] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);

  useEffect(() => {
    isMounted.current = true; // Компонент смонтирован
    if (username) {
      const decodedUsername = decodeURIComponent(username as string);
      fetch(`http://localhost:3000/api/user?username=${decodedUsername}`)
        .then((res) => res.json())
        .then((data: UserProfileData) => {
          if (!isMounted.current) return; // Если компонент размонтирован, ничего не делаем
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
      isMounted.current = false; // При размонтировании устанавливаем флаг в false
    };
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

      const contentHtml = draftToHtml(convertToRaw(content.getCurrentContent()));

      const res = await fetch("http://localhost:3000/api/create-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: contentHtml,
          email: session.user.email,
          tags: tagsArray,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (isMounted.current) setPostError(data.error || "Ошибка создания поста");
      } else {
        const newPost: PostData = data.post;
        if (isMounted.current) {
          setUser((prev) =>
            prev ? { ...prev, posts: [newPost, ...(prev.posts || [])] } : prev
          );
          setTitle("");
          setContent(EditorState.createEmpty());
          setTagsInput("");
          setShowCreatePostForm(false);
        }
      }
    } catch {
      if (isMounted.current) setPostError("Ошибка сети при создании поста");
    } finally {
      if (isMounted.current) setCreatingPost(false);
    }
  };

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
          <Button onClick={handleToggleCreatePostForm}>Создать пост</Button>
        )}
      </div>

      {/* Форма создания поста */}
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
              <TextEditor
                editorState={content}
                onEditorStateChange={setContent}
                placeholder="Содержание..."
                className="mb-2"
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
