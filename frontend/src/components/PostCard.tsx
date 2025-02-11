import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookOpen, MessageSquare } from "lucide-react";
import { LikeButton } from "@/components/LikeButton";
import Link from "next/link";

interface PostCardProps {
  id: string;
  title: string;
  content: string;
  author: { name: string; avatar?: string };
  createdAt: Date;
  postTags: { tag: { name: string } }[];
  likeCount: number;
  isLiked: boolean;
  commentCount: number;
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
}: PostCardProps) => {
  const formattedDate = new Date(createdAt).toLocaleDateString();

  return (
    <Card className="group hover:border-primary/50 transition-colors animate-fade-in">
      <CardHeader className="flex flex-row items-center gap-4">
        <Avatar>
          {author.avatar ? (
            <AvatarImage src={author.avatar} alt={author.name} />
          ) : (
            <AvatarFallback>{author.name[0]}</AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <CardTitle className="text-lg group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {author.name} • {formattedDate}
          </p>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          {/* Кнопка лайка через компонент LikeButton */}
          <LikeButton
            postId={id}
            initialLiked={isLiked}
            initialCount={likeCount}
          />
          {/* Кнопка перехода на страницу поста для комментариев */}
          <Link href={`/posts/${id}`}>
            <button className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">{commentCount}</span>
            </button>
          </Link>
          <BookOpen className="w-5 h-5 group-hover:text-primary transition-colors" />
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        {postTags && postTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {postTags.map((pt, index) => (
              <span
                key={index}
                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
              >
                {pt.tag.name}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
