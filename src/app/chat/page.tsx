"use client";

import ChatList from "../../components/chat/ChatList";

const ChatPage = () => {
    return (
        <div className="flex h-screen bg-gray-900 text-white">
            <ChatList />
            <div className="flex-1 flex items-center justify-center text-xl">
                Выберите чат
            </div>
        </div>
    )
}

export default ChatPage;