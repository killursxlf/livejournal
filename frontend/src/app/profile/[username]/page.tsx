"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserRound, Mail, Calendar, Settings } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { FollowButton } from "@/components/FollowButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface UserProfileData {
  id: string;
  username: string;
  name: string;
  avatar?: string;
  bio?: string;
  email?: string;
  createdAt: string;
  posts?: PostData[];
  likedPosts?: PostData[]; 
  savedPosts?: PostData[]; 
  draftPosts?: PostData[]; 
  followerCount?: number;
  followingCount?: number;
  isFollow: boolean;
  error?: string;
}

interface PostData {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  publishAt?: string; 
  status: string; 
  author: {
    username: string;
    name: string;
    avatar?: string;
  };
  postTags?: PostTag[];
  likeCount: number;
  isLiked: boolean;
  commentCount: number;
  comments?: CommentData[];
  isSaved: boolean;
}

interface CommentData {
  id: number;
  content: string;
  createdAt: string;
  author: {
    username: string;
    name: string;
    avatar?: string;
  };
}

interface PostTag {
  postId: string;
  tagId: string;
  tag: {
    id: string;
    name: string;
  };
}

interface CurrentUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  token?: string;
}

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export default function UserProfile() {
  const { username } = useParams();
  const { data: session, status } = useSession();
  const userId = session?.user?.id;

  const currentUser: CurrentUser | undefined = session?.user?.name
    ? {
        id: session.user.id,
        username: session.user.username ?? "",
        name: session.user.name,
        avatar: session.user.image ?? undefined,
        token: "",
      }
    : undefined;

  const [user, setUser] = useState<UserProfileData | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [error, setError] = useState("");

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    if (!username || status === "loading") return;

    const decodedUsername = decodeURIComponent(username as string);

    fetch(
      `${backendURL}/api/user?username=${decodedUsername}&userId=${userId || ""}`,
      { credentials: "include" }
    )
      .then((res) => res.json())
      .then((data: UserProfileData) => {
        if (!isMounted.current) return;
        if (data.error) {
          setError(data.error);
        } else {
          if (data.avatar && !data.avatar.startsWith("http")) {
            data.avatar = `${backendURL}${data.avatar}`;
          }
          setUser(data);

          if (session?.user?.username === data.username) {
            setIsOwner(true);
          }
        }
      })
      .catch(() => {
        if (isMounted.current) setError("Ошибка загрузки профиля");
      });

    return () => {
      isMounted.current = false;
    };
  }, [username, status, session, userId]);

  if (status === "loading") return <p>Загрузка сессии...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Загрузка профиля...</p>;

  const joinedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const publishedPosts = user.posts?.filter((post: PostData) => {
    if (post.status === "DRAFT") return false;
    if (!post.publishAt) return false;
    const publishAt = new Date(post.publishAt);
    const now = new Date();
    return publishAt <= now;
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-8">
        <Card className="max-w-4xl mx-auto bg-gradient-to-br from-[#2A3041] to-[#1A1F2C] border-primary/20">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <Avatar className="w-32 h-32 ring-4 ring-primary/20 ring-offset-2 ring-offset-background">
                  {user.avatar ? (
                    <AvatarImage
                      src={user.avatar}
                      alt={user.name || user.username}
                    />
                  ) : (
                    <AvatarFallback>
                      <UserRound className="w-16 h-16" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </div>

              <div className="flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-2xl font-bold text-foreground mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/50">
                      {user.name || user.username}
                    </h1>
                    <p className="text-muted-foreground/80 leading-relaxed">
                      {user.bio || "Нет описания"}
                    </p>
                  </div>
                  {isOwner ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Settings className="w-4 h-4" />
                          <span className="sr-only">Редактировать профиль</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent 
                        align="end" 
                        className="bg-background shadow-lg z-50"
                      >
                        <DropdownMenuItem asChild>
                          <Link href={`/profile/${username}/edit`}>
                            <span className="text-foreground bg-background block px-2 py-1">
                              Редактировать профиль
                            </span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/profile/${username}/create-post`}>
                            <span className="text-foreground bg-background block px-2 py-1">
                              Создать пост
                            </span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <FollowButton
                      targetUserId={user.id}
                      isFollowingInitial={user.isFollow || false}
                    />
                  )}
                </div>

                <div className="flex gap-6 text-sm p-4 rounded-lg bg-black/20 backdrop-blur-sm border border-white/5">
                  <div className="px-4 border-r border-white/10">
                    <span className="block font-bold text-lg text-primary mb-1">
                      {user.posts ? user.posts.length : 0}
                    </span>
                    <span className="text-muted-foreground">записей</span>
                  </div>
                  <div className="px-4 border-r border-white/10">
                    <span className="block font-bold text-lg text-primary mb-1">
                      {user.followerCount || 0}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      подписчиков
                    </span>
                  </div>
                  <div className="px-4">
                    <span className="block font-bold text-lg text-primary mb-1">
                      {user.followingCount || 0}
                    </span>
                    <span className="text-muted-foreground ml-1">
                      подписок
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg bg-black/20 backdrop-blur-sm border border-white/5">
                  {user.email && (
                    <div className="flex items-center gap-2 text-muted-foreground/80">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                  )}
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Joined</span>
                    <span className="font-semibold">{joinedDate}</span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="posts" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-[600px]">
              <TabsTrigger value="posts">Записи</TabsTrigger>
              <TabsTrigger value="liked">Понравившиеся</TabsTrigger>
              <TabsTrigger value="bookmarks">Избранное</TabsTrigger>
              {isOwner && <TabsTrigger value="drafts">Черновики</TabsTrigger>}
            </TabsList>

            <TabsContent value="posts" className="space-y-6">
              {publishedPosts && publishedPosts.length > 0 ? (
                <div className="space-y-4">
                  {publishedPosts.map((post: PostData) => (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      content={post.content}
                      author={{
                        name: post.author?.name ?? "Unknown",
                        avatar: post.author?.avatar,
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
                          content: comment.content,
                          date: comment.createdAt,
                          author: comment.author?.name ?? "Unknown",
                          avatar: comment.author?.avatar,
                        })) ?? []
                      }
                      currentUser={currentUser}
                      isSaved={post.isSaved}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mt-4">Пока нет публикаций.</p>
              )}
            </TabsContent>

            <TabsContent value="drafts" className="space-y-6">
              {isOwner ? (
                <div className="space-y-4">
                  {(() => {
                    const now = new Date();
                    const scheduledPosts = user.posts?.filter(
                      (post: PostData) =>
                        post.status === "PUBLISHED" &&
                        post.publishAt &&
                        new Date(post.publishAt) > now
                    ) || [];
                    const drafts = user.draftPosts || [];
                    const allDrafts = [...drafts, ...scheduledPosts];
                    if (allDrafts.length === 0) {
                      return <p className="text-gray-500 mt-4">Пока нет черновиков.</p>;
                    }
                    return allDrafts.map((post: PostData) => (
                      <Link key={post.id} href={`/edit-draft/${post.id}`} passHref legacyBehavior>
                        <div className="cursor-pointer">
                          <PostCard
                            id={post.id}
                            title={post.title}
                            content={post.content}
                            author={{
                              name: post.author?.name ?? "Unknown",
                              avatar: post.author?.avatar,
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
                                content: comment.content,
                                date: comment.createdAt,
                                author: comment.author?.name ?? "Unknown",
                                avatar: comment.author?.avatar,
                              })) ?? []
                            }
                            currentUser={currentUser}
                            isSaved={post.isSaved}
                            scheduledMessage={
                              post.status === "PUBLISHED" &&
                              post.publishAt &&
                              new Date(post.publishAt) > now
                                ? `Публикация запланирована на ${new Date(post.publishAt).toLocaleString()}`
                                : undefined
                            }
                          />
                        </div>
                      </Link>
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-gray-500 mt-4">Пока нет черновиков.</p>
              )}
            </TabsContent>

            <TabsContent value="liked" className="space-y-6">
              {user.likedPosts && user.likedPosts.length > 0 ? (
                <div className="space-y-4">
                  {user.likedPosts.map((post: PostData) => (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      content={post.content}
                      author={{
                        name: post.author?.name ?? "Unknown",
                        avatar: post.author?.avatar,
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
                          content: comment.content,
                          date: comment.createdAt,
                          author: comment.author?.name ?? "Unknown",
                          avatar: comment.author?.avatar,
                        })) ?? []
                      }
                      currentUser={currentUser}
                      isSaved={post.isSaved}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mt-4">Нет понравившихся записей.</p>
              )}
            </TabsContent>

            <TabsContent value="bookmarks" className="space-y-6">
              {user.savedPosts && user.savedPosts.length > 0 ? (
                <div className="space-y-4">
                  {user.savedPosts.map((post: PostData) => (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      title={post.title}
                      content={post.content}
                      author={{
                        name: post.author?.name ?? "Unknown",
                        avatar: post.author?.avatar,
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
                          content: comment.content,
                          date: comment.createdAt,
                          author: comment.author?.name ?? "Unknown",
                          avatar: comment.author?.avatar,
                        })) ?? []
                      }
                      currentUser={currentUser}
                      isSaved={post.isSaved}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 mt-4">Нет избранных записей.</p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
