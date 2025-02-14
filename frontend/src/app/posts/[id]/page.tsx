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
  Share2,
  MessageSquare,
  UserRound,
  BookOpen,
  Copy,
  Facebook,
  X,
  ChevronDown,
} from "lucide-react";
import { LikeButton } from "@/components/LikeButton";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";

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
  isLiked: boolean;
};

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

const PostPage = () => {
  const params = useParams();
  const router = useRouter();
  const { id } = params; // id поста из URL
  const { data: session } = useSession();
  const { toast } = useToast();

  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>("");
  const [showAuthMessage, setShowAuthMessage] = useState<boolean>(false);

  useEffect(() => {
    if (!id) return;

    const fetchPost = async () => {
      try {
        const response = await fetch(`${backendURL}/api/getpost?id=${id}`, {
          credentials: "include",
        });
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
      setShowAuthMessage(false);
    }

    try {
      const commentData = {
        content: newComment,
        postId: id,
        userId: session.user.id,
      };

      const response = await fetch(`${backendURL}/api/comment`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        throw new Error("Ошибка при отправке комментария");
      }

      const savedComment = await response.json();

      setPost((prev) =>
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
      console.error("Ошибка отправки комментария:", error);
    }
  };

  // Функция копирования ссылки
  const handleCopyLink = async () => {
    const postUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(postUrl);
      console.log("Ссылка скопирована в буфер обмена");
    } catch (error) {
      console.error("Ошибка при копировании ссылки:", error);
    }
  };

  // Функция нативного шаринга
  const handleNativeShare = async () => {
    const postUrl = window.location.href;
    try {
      await navigator.share({
        title: post?.title,
        text: post?.title,
        url: postUrl,
      });
    } catch (error) {
      console.error("Ошибка при попытке поделиться:", error);
    }
  };

  // Функция для шаринга на выбранной платформе
  const handleSharePlatform = (platform: string) => {
    const postUrl = window.location.href;
    let shareUrl = "";

    switch (platform) {
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
          postUrl
        )}&text=${encodeURIComponent(post?.title || "")}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
          postUrl
        )}`;
        break;
      case "x":
        shareUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(
          postUrl
        )}&text=${encodeURIComponent(post?.title || "")}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  // Функция удаления комментария
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(`${backendURL}/api/comment-delete?id=${commentId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при удалении комментария");
      }

      // Обновляем состояние, убираем удалённый комментарий
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comments: prev.comments.filter((c) => c.id !== commentId),
              commentCount: prev.commentCount - 1,
            }
          : prev
      );

      toast({
        description: "Комментарий удален",
        duration: 2000,
      });
    } catch (error: unknown) {
      console.error("Ошибка при удалении комментария:", error);
      let message = "Ошибка при удалении комментария";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        description: message,
        duration: 2000,
      });
    }
  };

  if (loading) return <p>Загрузка...</p>;
  if (!post) return <p>Пост не найден.</p>;

  const formattedDate = new Date(post.createdAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
                    <Link href={`/posts/${post.id}`}>
                      <h1 className="text-2xl font-bold text-foreground mb-2 hover:text-primary transition-colors">
                        {post.title}
                      </h1>
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      <span
                        className="hover:text-primary cursor-pointer"
                        onClick={() =>
                          router.push(`/profile/${post.author.username}`)
                        }
                      >
                        {post.author.name}
                      </span>{" "}
                      • {formattedDate}
                    </p>
                  </div>
                </div>
                <div className="flex gap-4 items-center">
                  <LikeButton
                    postId={post.id}
                    initialLiked={post.isLiked}
                    initialCount={post.likeCount}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="h-8 w-8">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-[300px] backdrop-blur-md bg-background/95 border-white/10"
                      sideOffset={5}
                      style={{ zIndex: 1000 }}
                    >
                      <div className="px-3 py-2 text-sm">
                        <p className="text-muted-foreground mb-2">
                          Ссылка на пост:
                        </p>
                        <div className="flex gap-2 mb-2">
                          <Input
                            value={window.location.href}
                            readOnly
                            className="h-8 text-xs bg-black/20 border-white/10"
                          />
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={handleCopyLink}
                            className="h-8 px-2"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      {typeof navigator.share === "function" && (
                        <DropdownMenuItem onClick={handleNativeShare}>
                          <Share2 className="w-4 h-4 mr-2" />
                          <span>Поделиться</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => handleSharePlatform("telegram")}
                      >
                        <svg
                          className="w-4 h-4 mr-2"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0zm5.43 7.13l-1.84 8.66c-.14.63-.5.79-1.02.49l-2.82-2.08-1.36 1.31c-.15.15-.28.28-.57.28l.2-2.86 5.2-4.71c.23-.2-.05-.31-.35-.12l-6.42 4.04-2.77-.87c-.6-.19-.61-.6.13-.89l10.82-4.17c.5-.18.94.12.8.92z" />
                        </svg>
                        <span>Telegram</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSharePlatform("facebook")}
                      >
                        <Facebook className="w-4 h-4 mr-2" />
                        <span>Facebook</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleSharePlatform("x")}
                      >
                        <X className="w-4 h-4 mr-2" />
                        <span>X (Twitter)</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <BookOpen className="w-5 h-5 group-hover:text-primary transition-colors" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-invert max-w-none clamped-text"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
              <div className="flex flex-wrap gap-2 mt-6">
                {post.postTags.map((pt, index) => (
                  <Button
                    key={index}
                    variant="secondary"
                    size="sm"
                    className="text-xs"
                  >
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
                  </Link>
                  .
                </p>
              )}
            </form>
            {/* Список комментариев */}
            <div className="mt-4 space-y-4">
              {post.comments.map((comment) => (
                <Card
                  key={comment.id}
                  className="backdrop-blur-sm bg-black/20 border-white/5"
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <Avatar>
                      <AvatarImage src={comment.author.avatar} />
                      <AvatarFallback>
                        <UserRound className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-medium text-foreground">
                          {comment.author.name}
                        </p>
                        <div className="flex items-center gap-2 pr-4">
                          <span className="text-sm text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString("ru-RU", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {/* Кнопка удаления комментария – отображается, если пользователь является автором комментария 
                              или автором поста */}
                          {session &&
                            (session.user.username === comment.author.username ||
                              session.user.username === post.author.username) && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-white/5"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-[160px] backdrop-blur-md bg-background/95 border-white/10"
                                >
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-red-500 focus:text-red-500"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="15"
                                      height="15"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="mr-2"
                                    >
                                      <path d="M3 6h18" />
                                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                    </svg>
                                    Удалить
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground/90 mt-1">
                        {comment.content}
                      </p>
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
