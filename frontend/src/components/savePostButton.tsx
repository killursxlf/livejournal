"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { BookOpen } from "lucide-react";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface SavePostButtonProps {
  postId: string;
  isSavedInitial: boolean;
}

export function SavePostButton({ postId, isSavedInitial }: SavePostButtonProps) {
  const { data: session } = useSession();
  const [saved, setSaved] = useState(isSavedInitial);
  const [isProcessing, setIsProcessing] = useState(false);

  // Синхронизируем локальное состояние с изменением входящего пропса
  useEffect(() => {
    setSaved(isSavedInitial);
  }, [isSavedInitial]);

  const handleToggleSave = useCallback(async () => {
    if (isProcessing) return;

    // Оптимистичное обновление
    setSaved((prev) => !prev);
    setIsProcessing(true);

    try {
      const res = await fetch(`${backendURL}/api/toggle-saved-post`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId: session?.user?.id }),
      });
      const data = await res.json();
      if (res.ok && typeof data.saved === "boolean") {
        setSaved(data.saved);
      } else {
        throw new Error(data.error || "Ошибка при переключении избранного");
      }
    } catch (error: unknown) {
      console.error("Ошибка при переключении избранного:", error);
      // Откат оптимистичного обновления при ошибке
      setSaved((prev) => !prev);
    } finally {
      setIsProcessing(false);
    }
  }, [postId, session, isProcessing]);

  return (
    <Button onClick={handleToggleSave} variant="outline" size="icon" className="h-8 w-8" disabled={isProcessing}>
      <BookOpen
        className={`w-5 h-5 transition-colors ${
          saved ? "text-yellow-500" : "group-hover:text-primary"
        }`}
      />
    </Button>
  );
}
