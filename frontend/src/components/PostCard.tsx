"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, ChevronDown, ChevronUp, Send, Share2, Copy, Facebook, X } from "lucide-react";
import { LikeButton } from "@/components/LikeButton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { SavePostButton } from "@/components/savePostButton";
import ReactMarkdown from "react-markdown";

export interface Comment {
  id: number;
  author: string;
  avatar?: string;
  content: string;
  date: string;
}

interface CurrentUser {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  token?: string;
}

export interface PostCardProps {
  id: string;
  title: string;
  content: string;
  author: { name: string; avatar?: string };
  createdAt: Date;
  postTags: { tag: { name: string } }[];
  likeCount: number;
  isLiked: boolean;
  commentCount: number;
  comments?: Comment[];
  currentUser?: CurrentUser;
  isSaved?: boolean;
  scheduledMessage?: string;
}

export const PostCard = ({
  id,
  title,
  content,
  author,
  createdAt,
  postTags,
  likeCount,
  isLiked,
  commentCount,
  comments,
  currentUser,
  isSaved = false,
  scheduledMessage, 
}: PostCardProps) => {
  const { toast } = useToast();

  const formattedDate = new Date(createdAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });


  const [localComments, setLocalComments] = useState<Comment[]>(comments || []);
  const [showComments, setShowComments] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postUrl, setPostUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && id) {
      setPostUrl(`${window.location.origin}/posts/${id}`);
    }
    setLocalComments(comments || []);
  }, [comments, id]);

  const visibleComments = showAllComments ? localComments : localComments.slice(0, 2);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!currentUser) {
      return;
    }

    try {
      const payload = {
        content: newComment,
        postId: id,
        userId: currentUser.id,
      };

      const response = await fetch("/api/comment", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Ошибка при отправке комментария");
      }

      const data = await response.json();
      console.log("Ответ от API:", data);

      const convertedComment: Comment = {
        id: data.id,
        content: data.content,
        date: data.createdAt,
        author: data.author.name,
        avatar: data.author.avatar,
      };

      setLocalComments((prev) => [convertedComment, ...prev]);
      setNewComment("");
    } catch (error) {
      console.error("Ошибка при отправке комментария:", error);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      console.log("Ссылка скопирована в буфер обмена");
    } catch (error) {
      console.error("Ошибка при копировании ссылки:", error);
    }
  };

  const handleNativeShare = async () => {
    const postUrl = window.location.href;
    try {
      await navigator.share({
        title,
        text: title,
        url: postUrl,
      });
    } catch (error) {
      console.error("Ошибка при попытке поделиться:", error);
    }
  };

  const handleSharePlatform = (platform: string) => {
    const postUrl = window.location.href;
    let shareUrl = "";

    switch (platform) {
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(title)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
        break;
      case "x":
        shareUrl = `https://x.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(title)}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
      const response = await fetch(`${backendUrl}/api/comment-delete?id=${commentId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ошибка при удалении комментария");
      }

      setLocalComments((prev) => prev.filter((c) => c.id !== commentId));
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

  return (
    <Card className="group hover:border-primary/50 transition-all duration-300 backdrop-blur-sm bg-black/20 hover:bg-black/30 border-white/5 shadow-lg animate-fade-in relative">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          {author.avatar ? (
            <AvatarImage src={author.avatar} alt={author.name} />
          ) : (
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
        <Link href={`/posts/${id}`}>
          <CardTitle className="text-lg text-white transition-colors font-medium">
            {title}
          </CardTitle>
        </Link>
          {scheduledMessage && (
            <p className="text-xs italic text-muted-foreground mt-1">
              {scheduledMessage}
            </p>
          )}
          <p className="text-sm text-muted-foreground/80">
            {author.name} • {formattedDate}
          </p>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <LikeButton postId={id} initialLiked={isLiked} initialCount={likeCount} />
          <button
            className="flex items-center gap-1"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="w-4 h-4" />
            <span className="text-sm">{commentCount}</span>
          </button>
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
                <p className="text-muted-foreground mb-2">Ссылка на пост:</p>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={postUrl}
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
              <DropdownMenuItem onClick={() => handleSharePlatform("telegram")}>
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
              <DropdownMenuItem onClick={() => handleSharePlatform("facebook")}>
                <Facebook className="w-4 h-4 mr-2" />
                <span>Facebook</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleSharePlatform("x")}>
                <X className="w-4 h-4 mr-2" />
                <span>X (Twitter)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <SavePostButton postId={id} isSavedInitial={isSaved} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="clamped-text text-muted-foreground">
          {/* Используем ReactMarkdown для рендеринга контента */}
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
        {postTags && postTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {postTags.map((pt, index) => (
              <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                #{pt.tag.name}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      {showComments && (
        <div className="mt-6 space-y-4 pb-4">
          <div className="h-px bg-border/5 my-4" />
          <form onSubmit={handleSubmitComment} className="flex gap-2">
            <Textarea
              placeholder="Написать комментарий..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="ml-4 min-h-[60px] bg-black/20 border-white/5 text-sm"
            />
            <Button type="submit" size="icon" className="h-[60px] shrink-0 mr-4" disabled={!newComment.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
          {visibleComments.map((comment, index) => (
            <div key={comment.id ?? index} className="flex items-start gap-3 ml-4 mb-4">
              <Avatar className="w-6 h-6">
                <AvatarImage src={comment.avatar} alt={comment.author} />
                <AvatarFallback>{comment.author?.[0] || "?"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{comment.author}</span>
                  <div className="flex items-center gap-2 pr-4">
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.date).toLocaleString("ru-RU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-white/5">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-[160px] backdrop-blur-md bg-background/95 border-white/10">
                        <DropdownMenuItem onClick={() => handleDeleteComment(comment.id)} className="text-red-500 focus:text-red-500">
                          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground/90">{comment.content}</p>
              </div>
            </div>
          ))}
          {localComments.length > 2 && (
            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs" onClick={() => setShowAllComments(!showAllComments)}>
              {showAllComments ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" /> Скрыть
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" /> Показать все комментарии
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};
