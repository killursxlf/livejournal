"use client";

import { useParams } from "next/navigation";
import Chat from "@/components/chat/Chat";

const ChatPage = () => {
  const { chatId } = useParams();

  if (!chatId || typeof chatId !== "string") return <p>Загрузка...</p>;

  return <Chat chatId={chatId} />;
};

export default ChatPage;
