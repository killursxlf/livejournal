"use client";

import { useEffect, useState } from "react";
import { PostCard } from "@/components/PostCard";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Filter, TrendingUp, BookMarked, Rss } from "lucide-react";

interface PostTag {
  postId: string;
  tagId: string;
  tag: {
    id: string;
    name: string;
  };
}

interface Post {
  id: string;
  title: string;
  content: string;
  createdAt: string; 
  author: {
    username: string;
    name: string;
    avatar?: string;
  };
  postTags?: PostTag[];
}


export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/posts")
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
  }, []);

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
        {/* Заголовок и фильтры */}
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
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              Фильтры
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Популярное
            </Button>
          </div>
        </div>

        {/* Основной контент и боковая панель */}
        <div className="grid grid-cols-12 gap-6">
          {/* Основная область с постами */}
          <div className="col-span-12 lg:col-span-8">
            <div className="space-y-6">
              {posts.map((post) => (
                <PostCard
                key={post.id}
                {...post}
                createdAt={new Date(post.createdAt)}
                postTags={
                  post.postTags
                    ? post.postTags.map((pt) => ({ tag: { name: pt.tag.name } }))
                    : []
                }
              />              
              ))}
            </div>
          </div>

          {/* Боковая панель */}
          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-6 space-y-6">
              {/* Популярные теги */}
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
                          post.postTags ? post.postTags.map((pt: PostTag) => pt.tag.name) : []
                        )
                      )
                    ).map((tag: string) => (
                      <Button key={tag} variant="secondary" size="sm" className="text-xs">
                        #{tag}
                      </Button>
                  ))}
                  </div>
                </ScrollArea>
              </div>

              {/* RSS лента */}
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
