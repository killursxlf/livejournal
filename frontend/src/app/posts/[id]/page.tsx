"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Heart,
  MessageSquare,
  Share2,
  UserRound,
} from "lucide-react";

// Определяем тип для комментария
type CommentType = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
    name: string;
    avatar: string;
  };
};

// Определяем тип для поста
type PostType = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
    name: string;
    avatar: string;
  };
  postTags: { tag: { name: string } }[];
  likeCount: number;
  commentCount: number;
  comments: CommentType[];
  isLiked?: boolean;
};

const PostPage = () => {
  const params = useParams();
  const router = useRouter();
  const { id } = params; // id поста из URL

  // Получаем данные сессии (если пользователь аутентифицирован)
  const { data: session } = useSession();

  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>("");
  const [showAuthMessage, setShowAuthMessage] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const response = await fetch(`http://localhost:3000/api/getpost?id=${id}`);
        if (!response.ok) {
          throw new Error("Ошибка при получении поста");
        }
        const data = await response.json();
        setPost(data);
      } catch (error) {
        console.error("Ошибка при получении поста:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleSubmitComment = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    if (!session) {
      setShowAuthMessage(true);
      return;
    } else {
      // Если пользователь авторизован, скрываем сообщение (если оно было)
      setShowAuthMessage(false);
    }

    try {
      const commentData = { 
        content: newComment,
        postId: id,
        userId: session.user.id,
      };

      const response = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(commentData)
      });

      if (!response.ok) {
        throw new Error('Ошибка при отправке комментария');
      }

      const savedComment = await response.json();

      setPost(prev =>
        prev
          ? {
              ...prev,
              comments: [...prev.comments, savedComment],
              commentCount: prev.commentCount + 1,
            }
          : prev
      );

      setNewComment("");
    } catch (error) {
      console.error('Ошибка отправки комментария:', error);
    }
  };

  if (loading) return <p>Загрузка...</p>;
  if (!post) return <p>Пост не найден.</p>;

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6">
        <div className="max-w-4xl mx-auto">
          {/* Кнопка навигации назад */}
          <button
            onClick={() => router.push("/posts")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к списку постов
          </button>

          {/* Отображение поста */}
          <Card className="mb-8 backdrop-blur-sm bg-black/20 border-white/5">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <Avatar
                    className="cursor-pointer"
                    onClick={() => router.push(`/profile/${post.author.username}`)}
                  >
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>
                      <UserRound className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">
                      {post.title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                      <span
                        className="hover:text-primary cursor-pointer"
                        onClick={() => router.push(`/profile/${post.author.username}`)}
                      >
                        {post.author.name}
                      </span>{" "}
                      • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Выводим HTML контент поста */}
              <div
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
              <div className="flex flex-wrap gap-2 mt-6">
                {post.postTags.map((pt, index) => (
                  <Button key={index} variant="secondary" size="sm" className="text-xs">
                    #{pt.tag.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Комментарии */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Комментарии</h2>
            </div>
            {/* Форма для добавления комментария */}
            <form onSubmit={handleSubmitComment} className="space-y-4">
              <Textarea
                placeholder="Оставьте свой комментарий..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[100px] bg-black/20 border-white/5"
              />
              <Button type="submit" className="w-full sm:w-auto">
                Отправить комментарий
              </Button>
              {/* Если пользователь не авторизован и попытался отправить комментарий, показываем сообщение */}
              {!session && showAuthMessage && (
                <p className="mt-2 text-sm text-red-500">
                  Чтобы оставить комментарий, пожалуйста,{" "}
                  <Link href="/login" className="underline text-blue-500">
                    войдите
                  </Link>.
                </p>
              )}
            </form>
            {/* Отображение списка комментариев */}
            <div className="mt-4">
              {post.comments.map((comment) => (
                <Card key={comment.id} className="mb-2">
                  <CardContent className="flex items-start gap-4 p-4">
                    <Avatar>
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback>
                        <UserRound className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{comment.author.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                      <p>{comment.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PostPage;
