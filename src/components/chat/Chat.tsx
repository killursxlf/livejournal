"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react"; 
import Message from "./Message";
import ChatInput from "./ChatInput";

type MessageType = {
  id: string;
  sender: { id: string; username: string; avatar: string | null };
  content: string;
  forwardedFrom?: { id: string; senderId: string; content: string } | null;
  isRead: boolean;
  senderId: string;
};

const Chat: React.FC<{ chatId: string }> = ({ chatId }) => {
  const [messages, setMessages] = useState<MessageType[]>([]);
  const { data: session } = useSession(); 
  const senderId = session?.user?.id; 
  const API_URL = "http://localhost:3000/api"; 

  useEffect(() => {
    loadMessages();
  }, [chatId]);

  // 🔹 Загружаем сообщения из API
  const loadMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/${chatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else {
        console.error("Ошибка загрузки сообщений", res.status);
      }
    } catch (error) {
      console.error("Ошибка сети", error);
    }
  };

  // 🔹 Отправляем сообщение
  const handleSendMessage = async (message: string) => {
    if (!senderId) {
      console.error("Ошибка: пользователь не авторизован");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/chat/${chatId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: message, senderId }),
      });

      if (res.ok) {
        loadMessages(); // Обновляем список сообщений после отправки
      } else {
        console.error("Ошибка отправки", res.status);
      }
    } catch (error) {
      console.error("Ошибка сети", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white p-4">
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg) => (
          <Message key={msg.id} {...msg} isMine={msg.senderId === senderId} />
        ))}
      </div>
      <ChatInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default Chat;
