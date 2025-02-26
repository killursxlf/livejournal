"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PostCard } from "@/components/PostCard";
import { Card, CardContent} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Calendar, MessageSquare, Users, Bell, BellOff } from "lucide-react";
import { CommunityMembersList } from "@/components/community/CommunityMembersList";
import { CommunityRules } from "@/components/community/CommunityRules";
import { CommunityStats } from "@/components/community/CommunityStats";
import { useToast } from "@/components/ui/use-toast";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

const Community = () => {
  const { id: communityId } = useParams();
  const { toast } = useToast();
  
  const [community, setCommunity] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isJoined, setIsJoined] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);

  useEffect(() => {
    async function fetchCommunity() {
      try {
        const res = await fetch(`${backendURL}/api/community?id=${communityId}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Ошибка загрузки сообщества");
        }
        const data = await res.json();
        setCommunity(data);
        setPosts(data.posts || []);
        // Если участники записаны через связующую таблицу, берем вложенное поле user
        setMembers(data.members?.map((m: any) => m.user) || []);
      } catch (error: any) {
        toast({ title: error.message || "Ошибка загрузки сообщества" });
      }
    }
    if (communityId) {
      fetchCommunity();
    }
  }, [communityId, toast]);

  if (!community) {
    return <div>Loading...</div>;
  }

  // Если поле memberCount отсутствует, используем длину массива участников
  const memberCount = community.memberCount || members.length;
  // Фильтруем членов с ролью ADMIN или MODERATOR
  const moderators = community.members?.filter((member: any) => 
    member.role === "ADMIN" || member.role === "MODERATOR"
  ) || [];
  

  const handleJoinCommunity = () => {
    setIsJoined(!isJoined);
  };

  const handleToggleNotifications = () => {
    setIsNotificationsEnabled(!isNotificationsEnabled);
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container pb-8">
        {/* Обложка сообщества */}
        <div className="relative w-full h-64 md:h-80 rounded-b-lg overflow-hidden mb-20 animate-fade-in">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${community.background || "/placeholder.svg"})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
        </div>

        {/* Блок с аватаром, основной информацией и кнопкой присоединиться */}
        <div className="relative z-10 mx-8 flex items-center justify-between -mt-16">
          <div className="flex items-end">
            <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
              <AvatarImage src={community.avatar || "/placeholder.svg"} alt={community.name} />
              <AvatarFallback className="bg-primary/20 text-2xl">
                {community.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4 mb-2">
              <h1 className="text-2xl font-bold text-foreground">{community.name}</h1>
              <p className="text-muted-foreground text-sm flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {memberCount} участников
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={isJoined ? "outline" : "default"}
              size="sm"
              onClick={handleJoinCommunity}
            >
              {isJoined ? (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Вы участник
                </>
              ) : (
                <>
                  <Users className="w-4 h-4 mr-2" />
                  Присоединиться
                </>
              )}
            </Button>
            {isJoined && (
              <Button variant="outline" size="sm" onClick={handleToggleNotifications}>
                {isNotificationsEnabled ? (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Отключить уведомления
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Включить уведомления
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Боковая информация о сообществе */}
          <div className="lg:col-span-1 space-y-6">
            {/* О сообществе */}
            <Card className="backdrop-blur-sm bg-black/20 border-white/5 overflow-hidden shadow-lg animate-fade-in">
              <CardContent className="p-6">
                <h2 className="text-lg font-medium mb-4 flex items-center">
                  <Shield className="w-4 h-4 mr-2 text-primary" />
                  О сообществе
                </h2>
                <p className="text-muted-foreground/90 text-sm leading-relaxed mb-4">
                  {community.description}
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    Создано:   {new Date(community.createdAt).toLocaleDateString("ru-RU", {
                        year: "numeric",
                        month: "long",
                    })}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Постов: {community.postCount || 0}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Правила сообщества */}
            <CommunityRules rules={community.rules?.split("\n") || []} />

            {/* Модераторы сообщества */}
            <Card className="backdrop-blur-sm bg-black/20 border-white/5 overflow-hidden shadow-lg animate-fade-in">
            <CardContent className="p-6">
                <h2 className="text-lg font-medium mb-4 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-primary" />
                Модераторы
                </h2>
                <div className="space-y-3">
                {moderators.map((moderator: any) => (
                    <div key={moderator.user.id} className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={moderator.user.avatar || "/placeholder.svg"} alt={moderator.user.name} />
                        <AvatarFallback>{moderator.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{moderator.user.name}</span>
                    </div>
                ))}
                </div>
            </CardContent>
            </Card>

            {/* Статистика сообщества */}
            <CommunityStats
              memberCount={memberCount}
              postCount={community.postCount || 0}
              activeMembers={42}
              newMembersToday={8}
            />
          </div>

          {/* Основной контент – посты и участники */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px] bg-black/20 border border-white/10">
                <TabsTrigger value="posts">Публикации</TabsTrigger>
                <TabsTrigger value="members">Участники</TabsTrigger>
              </TabsList>
              <TabsContent value="posts" className="space-y-6 mt-6">
                {posts.map((post, index) => (
                  <PostCard key={index} {...post} />
                ))}
                <Button className="w-full mt-4" variant="outline">
                  Загрузить еще
                </Button>
              </TabsContent>
              <TabsContent value="members" className="mt-6">
                <CommunityMembersList members={community.members} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Community;
