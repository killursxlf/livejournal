"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface FollowButtonProps {
  targetUserId: string;
  isFollowingInitial: boolean;
}

export function FollowButton({ targetUserId, isFollowingInitial }: FollowButtonProps) {
  const { data: session } = useSession();
  const [isFollowing, setIsFollowing] = useState(isFollowingInitial);

  useEffect(() => {
    setIsFollowing(isFollowingInitial);
  }, [isFollowingInitial]);

  const handleToggleFollow = async () => {
    try {
      const payload = {
        followingId: targetUserId,
        userId: session?.user?.id,
      };

      const response = await fetch(`${backendURL}/api/toggle-follow`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ошибка при переключении подписки");
      }

      setIsFollowing(data.followed);
    } catch (error: unknown) {
      let message = "Ошибка при переключении подписки";
      if (error instanceof Error) {
        message = error.message;
      }
      console.error(message);
    }
  };

  const buttonClasses = isFollowing
    ? "bg-gray-900 border border-gray-900 text-primary hover:bg-gray-800 hover:text-white"
    : "bg-primary text-white hover:bg-primary/90";

  return (
    <Button onClick={handleToggleFollow} className={buttonClasses}>
      {isFollowing ? "Отписаться" : "Подписаться"}
    </Button>
  );
}
