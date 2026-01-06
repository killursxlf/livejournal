"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type ChatType = {
  id: string;
  participants: { id: string; username: string; avatar: string | null }[];
};

const ChatList: React.FC = () => {
  const [chats, setChats] = useState<ChatType[]>([]);
  const { data: session } = useSession();
  const API_URL = "http://localhost:3000/api";

  useEffect(() => {
    if (session?.user?.id) {
      loadChats();
    }
  }, [session?.user?.id]);

  const loadChats = async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch(`${API_URL}/user/${session.user.id}/chats`);
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      } else {
        console.error("Ошибка загрузки чатов", res.status);
      }
    } catch (error) {
      console.error("Ошибка сети", error);
    }
  };

  return (
    <div className="w-1/4 bg-gray-800 p-4 h-screen text-white">
      <h2 className="text-lg font-bold mb-4">Диалоги</h2>
      {chats.length === 0 ? (
        <p className="text-gray-400">Нет диалогов</p>
      ) : (
        <ul>
          {chats.map((chat) => {
            const otherUser = chat.participants.find((p) => p.id !== session?.user?.id);

            if (!otherUser) {
              console.warn(`Чат ${chat.id} не содержит другого пользователя`);
              return null;
            }

            return (
              <li key={chat.id} className="mb-2">
                <Link
                  href={`/chat/${chat.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700"
                >
                  <img
                    src={otherUser.avatar || "/default-avatar.png"}
                    alt={otherUser.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="text-sm">{otherUser.username}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ChatList;
