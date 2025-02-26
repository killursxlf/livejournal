"use client";

import { useEffect, useState } from "react";
import type { CurrentUser, Post, PostTag } from "@/types/type";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter, TrendingUp, BookMarked, Rss, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export default function PostsPage() {
  const { data: session, status } = useSession();
  const userID = session?.user?.id ?? "";

  const currentUser: CurrentUser | undefined = session?.user
  ? {
      id: session.user.id,
      username: session.user.username ?? "",
      name: session.user.name ?? "Anonymous", // значение по умолчанию, если name отсутствует
      avatar: session.user.image ?? "/placeholder.svg",
      token: "",
    }
  : undefined;

  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedTag, setSelectedTag] = useState<string>("");
  const [sort, setSort] = useState<"latest" | "popular">("latest");
  const [subscriptionsFilter, setSubscriptionsFilter] = useState<boolean>(false);

  useEffect(() => {
    if (status === "loading") return;

    const params = new URLSearchParams();
    if (userID !== "") params.append("userId", userID);
    if (selectedTag) params.append("tag", selectedTag);
    if (sort === "popular") params.append("sort", "popular");
    if (subscriptionsFilter) {
      params.append("subscriptions", "true");
    }

    const url = `${backendURL}/api/posts${
      params.toString() ? "?" + params.toString() : ""
    }`;

    fetch(url)
      .then((res) => res.json())
      .then((data: Post[] | { error: string }) => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else if ("error" in data) {
          setError(data.error);
        }
      })
      .catch(() => setError("Ошибка при загрузке ленты"))
      .finally(() => setLoading(false));
  }, [status, userID, selectedTag, sort, subscriptionsFilter]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-center text-gray-600">Загрузка ленты...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-center text-red-500">Ошибка: {error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-6">
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Последние записи
            </h1>
            <p className="text-muted-foreground">
              Откройте для себя интересные истории наших авторов
            </p>
          </div>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant={subscriptionsFilter ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                >
                  <Users className="w-4 h-4" />
                  Подписки
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-[200px] backdrop-blur-md bg-background/95 border-white/10"
              >
                <DropdownMenuLabel>Фильтр записей</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSubscriptionsFilter(false)}>
                  Все записи
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSubscriptionsFilter(true)}>
                  Записи от подписок
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Фильтры
            </Button>
            <Button
              variant={sort === "popular" ? "default" : "outline"}
              size="sm"
              className="gap-2"
              onClick={() =>
                setSort(sort === "popular" ? "latest" : "popular")
              }
            >
              <TrendingUp className="w-4 h-4" />
              {sort === "popular" ? "Популярное" : "Последние"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  title={post.title}
                  content={post.content}
                  author={{
                    id: post.author.id,
                    username: post.author.username,
                    name: post.author.name,
                    avatar: post.author.avatar,
                  }}
                  createdAt={new Date(post.createdAt)}
                  postTags={
                    post.postTags
                      ? post.postTags.map((pt) => ({
                          tag: { name: pt.tag.name },
                        }))
                      : []
                  }
                  likeCount={post.likeCount}
                  isLiked={post.isLiked}
                  commentCount={post.commentCount}
                  comments={
                    post.comments?.map((comment) => ({
                      id: comment.id,
                      authorUserName: comment.author.username,
                      authorId: comment.author.id,
                      content: comment.content,
                      date: comment.createdAt,
                      author: comment.author.name,
                      avatar: comment.author.avatar,
                    })) ?? []
                  }
                  currentUser={currentUser}
                  isSaved={post.isSaved}
                />
              ))}
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-6 space-y-6">
              <div className="rounded-lg border border-white/5 p-4 backdrop-blur-sm bg-black/20">
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <BookMarked className="w-4 h-4" />
                  Популярные теги
                </h3>
                <ScrollArea className="h-[200px]">
                  <div className="flex flex-wrap gap-2">
                    {Array.from(
                      new Set(
                        posts.flatMap((post: Post) =>
                          post.postTags
                            ? post.postTags.map((pt: PostTag) => pt.tag.name)
                            : []
                        )
                      )
                    ).map((tag: string) => (
                      <Button
                        key={tag}
                        variant={selectedTag === tag ? "default" : "secondary"}
                        size="sm"
                        className="text-xs"
                        onClick={() => setSelectedTag(tag)}
                      >
                        #{tag}
                      </Button>
                    ))}
                    {selectedTag && (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="text-xs"
                        onClick={() => setSelectedTag("")}
                      >
                        Сбросить фильтр
                      </Button>
                    )}
                  </div>
                </ScrollArea>
              </div>

              <div className="rounded-lg border border-white/5 p-4 backdrop-blur-sm bg-black/20">
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Rss className="w-4 h-4" />
                  RSS лента
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Подпишитесь на RSS-ленту, чтобы быть в курсе новых публикаций
                </p>
                <Button variant="outline" size="sm" className="w-full">
                  Подписаться на RSS
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
