"use client";

import ChatList from "@/components/chat/ChatList";

const ChatLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen">
      <ChatList />
      <div className="w-3/4 bg-gray-900">{children}</div>
    </div>
  );
};

export default ChatLayout;
