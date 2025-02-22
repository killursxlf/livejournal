import React, { useState } from "react";

type ChatInputProps = 
{
  onSendMessage: (message: string) => void;
};

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage }) => 
{
  const [message, setMessage] = useState("");

  const handleSend = () => 
  {
    if (message.trim() === "") return;
    onSendMessage(message);
    setMessage("");
  };

  return (
    <div className="flex items-center gap-2 p-2 border-t bg-white">
      <input
        type="text"
        className="flex-1 p-2 border rounded"
        placeholder="Введите сообщение..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button className="bg-blue-500 text-white p-2 rounded" onClick={handleSend}>
        Отправить
      </button>
    </div>
  );
};

export default ChatInput;
