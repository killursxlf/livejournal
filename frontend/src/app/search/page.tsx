"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search as SearchIcon, X, ChevronRight } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

const VISIBLE_TAGS_COUNT = 6;

interface PostResult {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
    name: string;
    avatar: string;
  };
  postTags: {
    tag: { name: string };
  }[];
  likeCount: number;
  commentCount: number;
  comments: {
    id: string;
    content: string;
    createdAt: string;
    author: {
      username: string;
      name: string;
      avatar: string;
    };
  }[];
  isLiked?: boolean;
  isSaved?: boolean;
}

function transformAuthor(author: any) {
  return {
    id: author.username,       
    username: author.username,
    name: author.name,
    avatar: author.avatar,
  };
}

function transformComment(comment: any) {
  return {
    id: comment.id,
    content: comment.content,
    date: new Date(comment.createdAt).toISOString(),
    author: comment.author.name,         
    authorId: comment.author.username,     
    authorUserName: comment.author.username,
    avatar: comment.author.avatar,
  };
}

function transformPost(post: any) {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    author: transformAuthor(post.author),
    createdAt: new Date(post.createdAt),
    postTags: post.postTags,
    likeCount: post.likeCount,
    isLiked: post.isLiked ?? false,
    commentCount: post.commentCount,
    comments: post.comments?.map(transformComment) || [],
  };
}


export default function Search() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<PostResult[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [tagSearchQuery, setTagSearchQuery] = useState("");
  const [isTagDialogOpen, setIsTagDialogOpen] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const res = await fetch(`${backendURL}/api/get-tags`);
        if (res.ok) {
          const tagsData: { name: string }[] = await res.json();
          const tagNames = tagsData.map((tag) => tag.name);
          setAllTags(tagNames.sort());
        } else {
          console.error("Ошибка получения тегов");
        }
      } catch (error) {
        console.error("Ошибка получения тегов", error);
      }
    };
    fetchTags();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }
    if (selectedTags.length > 0) {
      params.set("tags", selectedTags.join(","));
    }
    router.push(`/search?${params.toString()}`);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const filteredTags = allTags.filter((tag) => {
    if (typeof tag !== "string") return false;
    return (
      tag.toLowerCase().includes(tagSearchQuery.toLowerCase()) &&
      !selectedTags.includes(tag)
    );
  });

  const visibleTags = allTags.slice(0, VISIBLE_TAGS_COUNT);

  useEffect(() => {
    const query = searchParams.get("q");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];

    if (query || tags.length > 0) {
      setIsLoading(true);
      const fetchSearchResults = async () => {
        try {
          const params = new URLSearchParams();
          if (query) {
            params.append("q", query);
          }
          if (tags.length > 0) {
            params.append("tags", tags.join(","));
          }
          const res = await fetch(`${backendURL}/api/search?${params.toString()}`);
          if (res.ok) {
            const data: PostResult[] = await res.json();
            setSearchResults(data);
          } else {
            console.error("Ошибка поиска");
            setSearchResults([]);
          }
        } catch (error) {
          console.error("Ошибка поиска", error);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSearchResults();
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                type="search"
                placeholder="Поиск по сайту..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button type="submit">
                <SearchIcon className="mr-2 h-4 w-4" />
                Найти
              </Button>
            </form>
            <div className="flex flex-wrap gap-2 items-center">
              {visibleTags.map((tag) => (
                <Button
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "secondary"}
                  size="sm"
                  onClick={() => toggleTag(tag)}
                  className="flex items-center gap-1"
                >
                  #{tag}
                  {selectedTags.includes(tag) && (
                    <X className="h-3 w-3 text-primary-foreground" />
                  )}
                </Button>
              ))}
              <Dialog open={isTagDialogOpen} onOpenChange={setIsTagDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Больше тегов
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Поиск по тегам</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <Input
                      placeholder="Поиск тега..."
                      value={tagSearchQuery}
                      onChange={(e) => setTagSearchQuery(e.target.value)}
                      className="w-full"
                    />
                    <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto">
                      {filteredTags.length > 0 ? (
                        filteredTags.map((tag) => (
                          <Button
                            key={tag}
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              toggleTag(tag);
                              if (tagSearchQuery) {
                                setTagSearchQuery("");
                              }
                            }}
                          >
                            #{tag}
                          </Button>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground w-full text-center py-2">
                          {tagSearchQuery ? "Теги не найдены" : "Нет доступных тегов"}
                        </p>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="text-sm text-muted-foreground">Выбранные теги:</span>
                {selectedTags.map((tag) => (
                  <Button
                    key={tag}
                    variant="default"
                    size="sm"
                    onClick={() => toggleTag(tag)}
                    className="flex items-center gap-1"
                  >
                    #{tag}
                    <X className="h-3 w-3 text-primary-foreground" />
                  </Button>
                ))}
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-4">Выполняется поиск...</p>
            </div>
          ) : (searchParams.get("q") || searchParams.get("tags")) ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">
                  Результаты поиска
                  {searchParams.get("q") && (
                    <span className="ml-2 text-muted-foreground">
                      по запросу: {searchParams.get("q")}
                    </span>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground">
                  Найдено: {searchResults.length}
                </p>
              </div>
              {searchResults.length > 0 ? (
                <div className="space-y-6">
                {searchResults.map((post) => {
                  const transformedPost = transformPost(post);
                  return <PostCard key={transformedPost.id} {...transformedPost} />;
                })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}