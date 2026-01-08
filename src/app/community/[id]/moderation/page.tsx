"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye, EyeOff, MessageSquare, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface PendingPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  communityId: string;
  createdAt: string;
  tags: string[];
}

const CommunityModeration: React.FC = () => {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const [pendingPosts, setPendingPosts] = useState<PendingPost[]>([]);
  const [viewingPost, setViewingPost] = useState<PendingPost | null>(null);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [showAuthor, setShowAuthor] = useState<boolean>(true);
  const [rejectReason, setRejectReason] = useState<string>("");

  useEffect(() => {
    async function fetchPosts(): Promise<void> {
      try {
        const response = await fetch(
          `${backendURL}/api/community/moderation/posts?communityId=${id}`,
          { credentials: "include" }
        );
        if (!response.ok) {
          console.error("Ошибка загрузки постов:", response.statusText);
          return;
        }
        const data = await response.json();
        setPendingPosts(data.posts);
      } catch (error) {
        console.error("Ошибка запроса:", error);
      }
    }
    if (id) {
      fetchPosts();
    }
  }, [id]);

  const handleViewPost = (post: PendingPost): void => {
    setViewingPost(post);
    setDialogOpen(true);
    setShowAuthor(true);
    setRejectReason("");
  };

  const handleCloseDialog = (): void => {
    setDialogOpen(false);
    setViewingPost(null);
  };

  const handleApprovePost = async (): Promise<void> => {
    if (!viewingPost) return;
    const newPublicationMode = showAuthor ? "USER" : "COMMUNITY";
    try {
      const res = await fetch(`${backendURL}/api/community/moderation/update-post`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: viewingPost.id,
          status: "PUBLISHED",
          publicationMode: newPublicationMode,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          variant: "default",
          description: `Пост "${viewingPost.title}" опубликован ${showAuthor ? "с указанием автора" : "анонимно"}`,
        });
        // Удаляем одобренный пост из списка
        setPendingPosts(pendingPosts.filter((p) => p.id !== viewingPost.id));
        handleCloseDialog();
      } else {
        toast({
          variant: "destructive",
          description: data.error || "Ошибка обновления поста",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        description: "Ошибка обновления поста",
      });
      console.error("Ошибка обновления поста:", error);
    }
  };

  const handleRejectPost = async (): Promise<void> => {
    if (!rejectReason.trim()) {
      toast({
        variant: "destructive",
        description: "Пожалуйста, укажите причину отклонения",
      });
      return;
    }
    try {
      const res = await fetch(`${backendURL}/api/community/moderation/reject-post`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: viewingPost?.id,
          reason: rejectReason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          variant: "destructive",
          description: data.error || "Ошибка отклонения поста",
        });
        return;
      }
      toast({
        variant: "destructive",
        description: `Пост "${viewingPost?.title}" отклонен`,
      });
      setPendingPosts((prevPosts) => prevPosts.filter((post) => post.id !== viewingPost?.id));
      handleCloseDialog();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Ошибка отклонения поста";

      toast({
        variant: "destructive",
        description: message,
      });
    }
  };
  

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, length: number = 60): string => {
    if (text.length <= length) return text;
    return text.substring(0, length) + "...";
  };

  return (
    <div className="min-h-screen bg-[#1A1F2C] text-white p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-[#9b87f5] to-[#7E69AB] bg-clip-text text-transparent">
              Модерация публикаций сообщества
            </h1>
            <p className="text-gray-400">
              Просмотр и утверждение предложенных постов
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push(`/community/${id}`)}>
            Вернуться к сообществу
          </Button>
        </div>

        {pendingPosts.length === 0 ? (
          <Card className="bg-black/20 border-white/5">
            <CardContent className="pt-6 text-center">
              <p className="text-muted-foreground">Нет постов на рассмотрении</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-black/20 border-white/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Ожидающие модерации посты ({pendingPosts.length})
              </CardTitle>
              <CardDescription>
                Посты, предложенные участниками сообщества
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-[#2A2A2A] border-b border-[#333333]">
                    <TableHead className="text-gray-400">Заголовок</TableHead>
                    <TableHead className="text-gray-400">Автор</TableHead>
                    <TableHead className="text-gray-400">Дата</TableHead>
                    <TableHead className="text-gray-400">Теги</TableHead>
                    <TableHead className="text-gray-400 text-right">
                      Действия
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPosts.map((post: PendingPost) => (
                    <TableRow key={post.id} className="hover:bg-[#2A2A2A] border-b border-[#333333]">
                      <TableCell className="font-medium text-gray-200">
                        {truncateText(post.title, 40)}
                      </TableCell>
                      <TableCell className="text-gray-300">{post.authorName}</TableCell>
                      <TableCell className="text-gray-300">{formatDate(post.createdAt)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {post.tags.map((tag: string) => (
                            <Badge key={tag} variant="outline" className="bg-[#2A2A2A] text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          className="text-[#9b87f5] hover:text-[#7E69AB] hover:bg-[#2A2A2A]"
                          onClick={() => handleViewPost(post)}
                        >
                          Рассмотреть
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="bg-[#222222] border-[#333333] text-white max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">
                Рассмотрение поста
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Просмотрите пост и примите решение о публикации
              </DialogDescription>
            </DialogHeader>
            {viewingPost && (
              <div className="space-y-6 py-4">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">{viewingPost.title}</h3>
                  <div className="flex items-center gap-2 mb-6">
                    <User className="h-4 w-4 text-[#9b87f5]" />
                    <span className="text-gray-300">{viewingPost.authorName}</span>
                    <span className="text-gray-500 text-sm">•</span>
                    <span className="text-gray-400 text-sm">{formatDate(viewingPost.createdAt)}</span>
                  </div>
                </div>
                <div className="bg-[#1A1F2C] p-4 rounded-md">
                  <p className="text-gray-200 whitespace-pre-line">{viewingPost.content}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {viewingPost.tags.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="bg-[#2A2A2A]">
                      #{tag}
                    </Badge>
                  ))}
                </div>
                <div className="pt-4 border-t border-[#333333]">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="show-author" checked={showAuthor} onCheckedChange={setShowAuthor} />
                      <label htmlFor="show-author" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                        {showAuthor ? (
                          <>
                            <Eye className="h-4 w-4 text-green-500" />
                            <span>Показывать автора</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="h-4 w-4 text-yellow-500" />
                            <span>Скрыть автора</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <X className="h-4 w-4 text-red-500" />
                        Причина отклонения (обязательно при отклонении)
                      </h4>
                      <Textarea
                        placeholder="Укажите причину, по которой пост отклоняется..."
                        className="bg-[#1A1F2C] border-[#333333] focus:border-[#9b87f5]"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="ghost" onClick={handleCloseDialog} className="text-gray-400 hover:text-white">
                Отмена
              </Button>
              <Button variant="destructive" onClick={handleRejectPost} className="gap-2">
                <X className="h-4 w-4" /> Отклонить
              </Button>
              <Button onClick={handleApprovePost} className="bg-[#9b87f5] hover:bg-[#7E69AB] gap-2">
                <Check className="h-4 w-4" /> Опубликовать
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CommunityModeration;
