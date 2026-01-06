import React from "react";
import clsx from "clsx"; 

type MessageProps = {
  id: string;
  sender: { id: string; username: string; avatar: string | null };
  content: string;
  forwardedFrom?: {
    id: string;
    senderId: string;
    content: string;
  } | null;
  isRead: boolean;
  isMine: boolean; 
};

const Message: React.FC<MessageProps> = ({ sender, content, forwardedFrom, isRead, isMine }) => {
  return (
    <div
      className={clsx(
        "flex flex-col p-3 rounded-lg shadow-md max-w-lg",
        isMine ? "bg-blue-500 text-white self-end" : "bg-gray-100 text-black self-start"
      )}
    >
      <div className="flex items-center gap-2">
        <span className="font-bold">{sender.username}</span>
        {!isRead && <span className="text-sm text-yellow-400">●</span>}
      </div>

      {forwardedFrom && (
        <div className="p-2 border-l-4 border-gray-400 bg-gray-200 text-sm mt-2">
          <p className="text-gray-600">Переслано:</p>
          <p className="font-semibold">{forwardedFrom.content}</p>
        </div>
      )}

      <p className="mt-2">{content}</p>
    </div>
  );
};

export default Message;
