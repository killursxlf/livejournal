"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search as SearchIcon,
  Users,
  MessageSquare,
  Calendar,
  Sparkles,
} from "lucide-react";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface PostTag {
  tag: { name: string };
}

interface Community {
  id: string;
  name: string;
  description: string;
  avatar: string;
  coverImage: string;
  background: string | null;
  postsCount: number;
  membersCount: number;
  createdAt: string;
  category: { name: string } | null;
  postTags: PostTag[];
  isPopular: boolean;
  tags: string[];
}

interface Category {
  id: string;
  name: string;
}

export default function CommunitiesSearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedTags, setSelectedTags] = useState<string[]>(
    searchParams.get("tags")?.split(",").filter(Boolean) || []
  );
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("popularity");

  const [allTags, setAllTags] = useState<string[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${backendURL}/api/get-categories`);
        if (res.ok) {
          const data: Category[] = await res.json();
          setCategories(data);
        } else {
          console.error("Ошибка получения категорий");
        }
      } catch (error) {
        console.error("Ошибка получения категорий", error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchCommunities(): Promise<void> {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("q", searchQuery.trim());
      if (selectedTags.length > 0) params.append("tags", selectedTags.join(","));
      if (categoryFilter && categoryFilter !== "all")
        params.append("categoryId", categoryFilter);      
      if (sortBy && sortBy !== "popularity") params.append("sort", sortBy);
  
      const queryString = params.toString();
      const url = queryString
        ? `${backendURL}/api/communities?${queryString}`
        : `${backendURL}/api/communities`;
  
      try {
        const res = await fetch(url);
        if (res.ok) {
          const data: Community[] = await res.json();
          const communitiesWithComputed: Community[] = data.map((community) => {
            const tags = community.postTags?.map((pt: PostTag) => pt.tag.name) || [];
            return {
              ...community,
              tags,
            };
          });
          setCommunities(communitiesWithComputed);
        } else {
          console.error("Ошибка получения сообществ");
          setCommunities([]);
        }
      } catch (error) {
        console.error("Ошибка получения сообществ", error);
        setCommunities([]);
      } finally {
        setLoading(false);
      }
    }
    fetchCommunities();
  }, [searchQuery, selectedTags, categoryFilter, sortBy]);
  
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleNavigateToCommunity = (id: string) => {
    router.push(`/community/${id}`);
  };

  const handleCreateCommunity = () => {
    router.push("/community/create");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim()); 
    }
    if (categoryFilter && categoryFilter !== "all") {
      params.set("category", categoryFilter);
    }
    if (sortBy && sortBy !== "newest") {
      params.set("sort", sortBy);
    }
    if (selectedTags.length > 0) {
      params.set("tags", selectedTags.join(","));
    }
    router.push(`/communities/search?${params.toString()}`);
  };
  

  return (
    <div className="min-h-screen bg-background">
      <main className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Сообщества</h1>
            <p className="text-muted-foreground">
              Найдите интересующие вас сообщества или создайте своё
            </p>
          </div>
          <Button onClick={handleCreateCommunity} className="mt-4 md:mt-0">
            <Plus className="mr-2 h-4 w-4" />
            Создать сообщество
          </Button>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-6">
          <Input
            type="search"
            placeholder="Поиск по сообществам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <SearchIcon className="mr-2 h-4 w-4" />
            Найти
          </Button>
        </form>

        {/* Фильтр тегов */}
        <div className="flex flex-wrap gap-2 mb-6">
          {allTags.map((tag) => (
            <Button
              key={tag}
              variant={selectedTags.includes(tag) ? "default" : "secondary"}
              size="sm"
              onClick={() => handleTagToggle(tag)}
              className="flex items-center gap-1"
            >
              #{tag}
            </Button>
          ))}
        </div>

        {/* Фильтр по категории и сортировка */}
        <div className="grid gap-4 mb-8 z-50 md:grid-cols-2 bg-[#1a1f2c] bg-opacity-100">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Все категории" />
          </SelectTrigger>
          <SelectContent
            style={{ backgroundColor: "#1a1f2c", opacity: 1, color: "white" }}
            className="shadow-lg"
          >
            <SelectItem
              value="all"
              style={{ backgroundColor: "#1a1f2c", opacity: 1, color: "white" }}
            >
              Все категории
            </SelectItem>
            {categories.map((cat) => (
              <SelectItem
                key={cat.id}
                value={cat.id}
                style={{ backgroundColor: "#1a1f2c", opacity: 1, color: "white" }}
              >
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="По популярности" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">По популярности</SelectItem>
              <SelectItem value="members">По количеству участников</SelectItem>
              <SelectItem value="posts">По количеству постов</SelectItem>
              <SelectItem value="newest">Сначала новые</SelectItem>
              <SelectItem value="alphabetical">По алфавиту</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-6">
          <p className="text-muted-foreground">
            Найдено сообществ: <strong>{communities.length}</strong>
          </p>
        </div>

        {loading ? (
          <p>Загрузка...</p>
        ) : communities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {communities.map((community) => (
              <Card
                key={community.id}
                className="overflow-hidden transition-all hover:shadow-md cursor-pointer relative"
                onClick={() => handleNavigateToCommunity(community.id)}
              >
                <div
                  className="h-32 bg-cover bg-center relative"
                  style={{
                    backgroundImage: `url(${community.coverImage || community.background || ""})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end">
                    <Avatar className="h-14 w-14 border-2 border-background">
                      <AvatarImage src={community.avatar} alt={community.name} />
                      <AvatarFallback>{community.name?.[0] || "?"}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3">
                      <h3 className="font-semibold text-lg line-clamp-1">
                        {community.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {community.category?.name || "Без категории"}
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {community.description}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {community.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {community.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{community.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="flex items-center">
                      <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span>{community.membersCount}</span>
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span>{community.postsCount}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1 text-muted-foreground" />
                      <span>
                        {new Date(community.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
                {community.isPopular && (
                  <div className="absolute top-2 right-2">
                    <Badge className="flex items-center space-x-1 bg-primary/80 backdrop-blur-sm">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Популярное
                    </Badge>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-xl font-medium">Сообществ не найдено</p>
            <p className="text-muted-foreground mt-2">
              Попробуйте изменить параметры поиска или создайте новое сообщество
            </p>
            <Button className="mt-4" onClick={handleCreateCommunity}>
              <Plus className="mr-2 h-4 w-4" />
              Создать сообщество
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
