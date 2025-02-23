"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SavePostButton } from "@/components/savePostButton";
import {
  ArrowLeft,
  MessageSquare,
  UserRound,
  ChevronDown,
  MoreVertical,
  Pencil,
  Trash2,
  Flag,
} from "lucide-react";
import { LikeButton } from "@/components/LikeButton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import ReactMarkdown from "react-markdown";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AnchorHTMLAttributes, ImgHTMLAttributes  } from "react";
import NextImage from "next/image";

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
  isSaved: boolean;
};

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

// Возможные причины жалобы
const REPORT_REASONS = [
  { id: "spam", label: "Спам" },
  { id: "inappropriate", label: "Неприемлемый контент" },
  { id: "fraud", label: "Мошенничество" },
  { id: "harassment", label: "Оскорбления" },
  { id: "other", label: "Другое" },
];

type ComplaintTarget = {
  type: "post" | "comment";
  id: string;
} | null;

interface ComplaintSubmission {
  reason: string;
  description: string;
  userId: string;
  postId?: string;
  commentId?: string;
}

const PostPage = () => {
  const params = useParams() as { id: string }; // Приводим id к типу string
  const router = useRouter();
  const { id } = params;
  const { data: session } = useSession();
  const [post, setPost] = useState<PostType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>("");
  const [showAuthMessage, setShowAuthMessage] = useState<boolean>(false);
  const { toast } = useToast();
  const renderMedia = (url: string) => {
    const lowerUrl = url.toLowerCase();
  
    // Обработка изображений
    if (/\.(jpg|jpeg|png|gif)$/.test(lowerUrl)) {
      return (
        <div className="flex justify-center">
          <NextImage
            loader={customLoader}
            src={url}
            alt="media"
            width={600}
            height={400}
            className="rounded"
          />
        </div>
      );
    }
  
    // Обработка видео файлов
    if (/\.(mp4|webm|ogg)$/.test(lowerUrl)) {
      return (
        <video controls className="max-w-full rounded">
          <source src={url} />
          Ваш браузер не поддерживает видео.
        </video>
      );
    }
  
    // Обработка ссылок на YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      // Преобразование URL в формат embed для YouTube
      let videoId = "";
      const youtubeRegex = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^\s&]+)/;
      const match = url.match(youtubeRegex);
      if (match && match[1]) {
        videoId = match[1];
      }
      const embedUrl = `https://www.youtube.com/embed/${videoId}`;
      return (
        <div className="relative pb-[56.25%] h-0 overflow-hidden rounded">
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src={embedUrl}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      );
    }
  
    // Если не подходит ни один из случаев, просто возвращаем ссылку
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {url}
      </a>
    );
  };
  
  // Кастомный компонент для ссылок
  type CustomLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    children?: React.ReactNode;
  };
  
  const CustomLink: React.FC<CustomLinkProps> = ({ href, children, ...props }) => {
    if (href && /\.(jpg|jpeg|png|gif|mp4|webm|ogg)$/i.test(href)) {
      return <>{renderMedia(href)}</>;
    }
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };

  const customLoader = ({ src }: { src: string }) => {
    return src;
  };
  // Кастомный компонент для изображений
  type CustomImageProps = ImgHTMLAttributes<HTMLImageElement>;
  const CustomImage: React.FC<CustomImageProps> = ({ src, alt = "", ...props }) => {
    if (typeof src === "string") {
      // Если ссылка на YouTube, используем renderMedia для рендеринга видео
      if (src.includes("youtube.com") || src.includes("youtu.be")) {
        return <>{renderMedia(src)}</>;
      }
      return (
        <div className="flex justify-center">
          <NextImage 
            loader={customLoader}
            src={src}
            alt={alt} 
            width={600}
            height={400}
            className="rounded"
          />
        </div>
      );
    }
    return <img alt={alt} {...props} />;
  };
  
  
  
  
  // Состояния для жалобы
  const [reportDialogOpen, setReportDialogOpen] = useState<boolean>(false);
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [selectedComplaintTarget, setSelectedComplaintTarget] =
    useState<ComplaintTarget>(null);

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

  const isAuthor =
    session && post && session.user.username === post.author.username;

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

  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await fetch(
        `${backendURL}/api/comment-delete?id=${commentId}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при удалении комментария");
      }

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

  const handleEditPost = () => {
    router.push(`/edit-draft/${post?.id}`);
  };

  const handleDeletePost = async () => {
    try {
      const response = await fetch(
        `${backendURL}/api/delete-post?id=${post?.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Ошибка при удалении поста");
      }
      toast({
        description: "Пост удален",
        duration: 2000,
      });
      router.push("/posts");
    } catch (error: unknown) {
      console.error(error);
      let message = "Ошибка при удалении поста";
      if (error instanceof Error) {
        message = error.message;
      }
      toast({
        description: message,
        duration: 2000,
      });
    }
  };

  // Для жалобы на пост
  const handleReportPost = () => {
    setSelectedComplaintTarget({ type: "post", id });
    setReportDialogOpen(true);
  };

  // Для жалобы на комментарий
  const handleReportComment = (commentId: string) => {
    setSelectedComplaintTarget({ type: "comment", id: commentId });
    setReportDialogOpen(true);
  };

  const handleSubmitReport = async () => {
    if (!selectedReason) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, выберите причину жалобы",
        variant: "destructive",
      });
      return;
    }
    if (!selectedComplaintTarget) {
      toast({
        title: "Ошибка",
        description: "Цель жалобы не определена",
        variant: "destructive",
      });
      return;
    }

    try {
      const bodyData: ComplaintSubmission = {
        reason: selectedReason,
        description: additionalInfo,
        userId: session!.user.id,
      };

      if (selectedComplaintTarget.type === "post") {
        bodyData.postId = selectedComplaintTarget.id;
      } else if (selectedComplaintTarget.type === "comment") {
        bodyData.commentId = selectedComplaintTarget.id;
      }

      const response = await fetch(`${backendURL}/api/complaints`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyData),
      });
      if (!response.ok) {
        throw new Error("Ошибка отправки жалобы");
      }
      await response.json();
      toast({
        title: "Жалоба отправлена",
        description: "Спасибо за обращение. Мы рассмотрим вашу жалобу.",
      });
      setReportDialogOpen(false);
      setSelectedReason("");
      setAdditionalInfo("");
      setSelectedComplaintTarget(null);
    } catch (error: unknown) {
      const err = error as Error;
      toast({
        title: "Ошибка",
        description: err.message || "Ошибка при отправке жалобы",
        variant: "destructive",
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
          <button
            onClick={() => router.push("/posts")}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад к списку постов
          </button>

          <Card className="mb-8 backdrop-blur-sm bg-black/20 border-white/5">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-4">
                  <Avatar
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/profile/${post.author.username}`)
                    }
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
                  <SavePostButton
                    postId={post.id}
                    isSavedInitial={post.isSaved}
                  />
                  {/* Кнопка жалобы для поста */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={handleReportPost}
                  >
                    <Flag className="w-4 h-4" />
                  </Button>
                  {isAuthor && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-[160px] backdrop-blur-md bg-black/90 border-white/10"
                      >
                        <DropdownMenuItem
                          className="gap-2"
                          onClick={handleEditPost}
                        >
                          <Pencil className="w-4 h-4" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 text-red-500 focus:text-red-500"
                          onClick={handleDeletePost}
                        >
                          <Trash2 className="w-4 h-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown components={{ a: CustomLink, img: CustomImage }}>{post.content}</ReactMarkdown>
              </div>
              <div className="flex flex-wrap gap-2 mt-6">
                {post.postTags.map((pt, index) => (
                  <Button key={index} variant="secondary" size="sm" className="text-xs">
                    #{pt.tag.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Форма отправки комментария */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <h2 className="text-xl font-semibold">Комментарии</h2>
            </div>
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
                                onClick={() => handleReportComment(comment.id)}
                              >
                                <Flag className="w-4 h-4 mr-2" />
                                Пожаловаться
                              </DropdownMenuItem>
                              {session &&
                                (session.user.username === comment.author.username ||
                                  session.user.username === post.author.username) && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="text-red-500 focus:text-red-500"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Удалить
                                  </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Диалог отправки жалобы */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent className="sm:max-w-[425px] gap-6 backdrop-blur-xl bg-black/60 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white/90">Отправить жалобу</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-white/90">Причина жалобы</Label>
              <div className="grid gap-2">
                {REPORT_REASONS.map((reason) => (
                  <Button
                    key={reason.id}
                    variant={selectedReason === reason.id ? "default" : "outline"}
                    className={`justify-start ${
                      selectedReason === reason.id
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "bg-black/40 text-white/90 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                    onClick={() => setSelectedReason(reason.id)}
                  >
                    {reason.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/90">Дополнительная информация</Label>
              <Textarea
                placeholder="Опишите подробнее причину жалобы..."
                value={additionalInfo}
                onChange={(e) => setAdditionalInfo(e.target.value)}
                className="min-h-[100px] bg-black/40 border-white/10 text-white/90 placeholder:text-white/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReportDialogOpen(false)}
              className="bg-black/40 text-white/90 border-white/10 hover:bg-white/10"
            >
              Отмена
            </Button>
            <Button
              onClick={handleSubmitReport}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Отправить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostPage;
