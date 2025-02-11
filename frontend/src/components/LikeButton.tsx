"use client";

import { useState } from "react";
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

  const handleLike = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
  
    try {
      const res = await fetch("/api/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId /*, userId если нужно */ }),
      });
      const data = await res.json();
  
      if (res.ok) {
        // Если сервер вернул новые данные, используем их
        if (typeof data.liked === "boolean" && typeof data.likeCount === "number") {
          setLiked(data.liked);
          setLikeCount(data.likeCount);
        } else {
          // Если сервер не вернул данные, переключаем состояние локально
          if (!liked) {
            setLiked(true);
            setLikeCount(prev => prev + 1);
          } else {
            setLiked(false);
            setLikeCount(prev => Math.max(0, prev - 1));
          }
        }
      }
    } catch (error) {
      console.error("Ошибка при обработке лайка:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <button onClick={handleLike} className="flex items-center gap-1" disabled={isProcessing}>
      <Heart className={`w-5 h-5 ${liked ? "text-red-500" : "text-gray-500"}`} />
      <span className="text-sm">{likeCount}</span>
    </button>
  );
}
 