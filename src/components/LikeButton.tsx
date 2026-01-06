"use client";

import { useState, useCallback } from "react";
import { Heart } from "lucide-react";

interface LikeButtonProps {
  postId: string;
  initialLiked: boolean;
  initialCount: number;
}

export function LikeButton({ postId, initialLiked, initialCount }: LikeButtonProps) {
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialCount);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleLike = useCallback(async () => {
    if (isProcessing) return;

    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? Math.max(0, prev - 1) : prev + 1));
    setIsProcessing(true);

    try {
      const res = await fetch("/api/like", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();

      if (res.ok && typeof data.liked === "boolean" && typeof data.likeCount === "number") {
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      }
    } catch (error) {
      console.error("Ошибка при обработке лайка:", error);
      setLiked((prev) => !prev);
      setLikeCount((prev) => (liked ? prev + 1 : Math.max(0, prev - 1)));
    } finally {
      setIsProcessing(false);
    }
  }, [postId, liked, isProcessing]);

  return (
    <button
      onClick={handleLike}
      className="flex items-center gap-1"
      disabled={isProcessing}
      aria-label={liked ? "Убрать лайк" : "Поставить лайк"}
    >
      <Heart className={`w-5 h-5 ${liked ? "text-red-500" : "text-gray-500"}`} />
      <span className="text-sm">{likeCount}</span>
    </button>
  );
}
