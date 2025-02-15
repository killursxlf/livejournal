"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import TitleInput from "@/components/TitleInput";
import TagsInput from "@/components/TagsInput";
import Editor from "@/components/Editor";
import Sidebar from "@/components/Sidebar";
import BackButton from "@/components/BackButton";

export default function EditPost() {
  // Получаем данные сессии (например, email пользователя)
  const { data: session } = useSession();

  // Состояния для всех полей формы
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("Article"); // "Article", "News", "Review" и т.д.
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  const submitPost = async (status: "PUBLISHED" | "DRAFT") => {
    const publicationTypeMapping: Record<string, string> = {
      Article: "ARTICLE",
      News: "NEWS",
      Review: "REVIEW",
    };

    const payload = {
      title,
      content,
      email: session?.user?.email, // email из сессии
      tags,
      status, // статус зависит от нажатой кнопки
      publicationType: publicationTypeMapping[postType],
      publishDate, // если пустая строка – на бекенде установится текущее время, если статус не DRAFT
      publishTime,
    };

    try {
      const res = await fetch(`${backendURL}/api/create-post`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        console.log("Пост успешно создан:", data);
        // Можно сделать редирект или показать уведомление
      } else {
        console.error("Ошибка создания поста:", data.error);
      }
    } catch (error) {
      console.error("Ошибка создания поста:", error);
    }
  };

  // Обработчик для кнопки публикации
  const handlePublish = () => {
    submitPost("PUBLISHED");
  };

  // Обработчик для кнопки сохранения черновика
  const handleSaveDraft = () => {
    submitPost("DRAFT");
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-16 flex-shrink-0">
            <BackButton />
          </div>
          <div className="flex-grow space-y-6">
            <TitleInput value={title} onChange={(e) => setTitle(e.target.value)} />
            <TagsInput value={tags} onChange={setTags} />
            <Editor value={content} onChange={setContent} />
          </div>
          <Sidebar
            postType={postType}
            setPostType={setPostType}
            publishDate={publishDate}
            setPublishDate={setPublishDate}
            publishTime={publishTime}
            setPublishTime={setPublishTime}
            onPublish={handlePublish}
            onSaveDraft={handleSaveDraft}
          />
        </div>
      </main>
    </div>
  );
}
