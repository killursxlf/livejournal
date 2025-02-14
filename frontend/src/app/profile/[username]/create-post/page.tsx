"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { EditorState, convertToRaw } from "draft-js";
import draftToHtml from "draftjs-to-html";
import { Editor } from "react-draft-wysiwyg";
import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TextEditorProps {
  editorState: EditorState;
  onEditorStateChange: (editorState: EditorState) => void;
  placeholder?: string;
  className?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({
  editorState,
  onEditorStateChange,
  placeholder = "Введите содержание...",
  className = "",
}) => {
  // Определяем customStyleMap с ключами в нижнем регистре
  const customStyleMap = {
    "fontsize-8": { fontSize: "8px" },
    "fontsize-9": { fontSize: "9px" },
    "fontsize-10": { fontSize: "10px" },
    "fontsize-11": { fontSize: "11px" },
    "fontsize-12": { fontSize: "12px" },
    "fontsize-14": { fontSize: "14px" },
    "fontsize-16": { fontSize: "16px" },
    "fontsize-18": { fontSize: "18px" },
    "fontsize-24": { fontSize: "24px" },
    "fontsize-30": { fontSize: "30px" },
    "fontsize-36": { fontSize: "36px" },
    "fontsize-48": { fontSize: "48px" },
    "fontsize-60": { fontSize: "60px" },
    "fontsize-72": { fontSize: "72px" },
    "fontsize-96": { fontSize: "96px" },

    "fontfamily-arial": { fontFamily: "Arial" },
    "fontfamily-georgia": { fontFamily: "Georgia" },
    "fontfamily-impact": { fontFamily: "Impact" },
    "fontfamily-tahoma": { fontFamily: "Tahoma" },
    "fontfamily-times new roman": { fontFamily: '"Times New Roman"' },
    "fontfamily-verdana": { fontFamily: "Verdana" },
  };

  return (
    <div className={className} style={{ position: "relative", overflow: "visible" }}>
      <Editor
        editorState={editorState}
        onEditorStateChange={onEditorStateChange}
        placeholder={placeholder}
        customStyleMap={customStyleMap}
        toolbar={{
          options: [
            "fontFamily",
            "fontSize",
            "inline",
            "blockType",
            "list",
            "textAlign",
            "colorPicker",
            "link",
            "embedded",
            "emoji",
            "image",
            "remove",
            "history",
          ],
          fontFamily: {
            options: ["Arial", "Georgia", "Impact", "Tahoma", "Times New Roman", "Verdana"],
          },
          fontSize: {
            options: [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96],
          },
          inline: { inDropdown: false },
          list: { inDropdown: false },
          textAlign: { inDropdown: true },
          link: { inDropdown: false },
          history: { inDropdown: false },
        }}
      />
    </div>
  );
};

export default function CreatePostPage() {
  const { username } = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<EditorState>(EditorState.createEmpty());
  const [tagsInput, setTagsInput] = useState("");
  const [postError, setPostError] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingPost(true);
    setPostError("");

    if (!session?.user?.email) {
      setPostError("Вы не авторизованы");
      setCreatingPost(false);
      return;
    }

    try {
      const tagsArray = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0);

      // Преобразуем содержимое редактора в HTML
      const contentHtml = draftToHtml(convertToRaw(content.getCurrentContent()));

      const res = await fetch(`${backendURL}/api/create-post`, {
        method: "POST",
        credentials: "include", // Передаём cookies
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content: contentHtml,
          email: session.user.email,
          tags: tagsArray,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPostError(data.error || "Ошибка создания поста");
      } else {
        // При успешном создании перенаправляем пользователя обратно в профиль
        router.push(`/profile/${username}`);
      }
    } catch {
      setPostError("Ошибка сети при создании поста");
    } finally {
      setCreatingPost(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="max-w-4xl mx-auto bg-gray-800 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2 text-white">Создать пост</h2>
          {postError && <p className="text-red-500 mb-2">{postError}</p>}
          <form onSubmit={handleCreatePost}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Заголовок"
              className="block w-full p-2 bg-gray-700 border border-gray-600 rounded mb-2 text-white placeholder-gray-400"
              required
            />
            <TextEditor
              editorState={content}
              onEditorStateChange={setContent}
              placeholder="Содержание..."
              className="mb-2"
            />
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="Теги (через запятую)"
              className="block w-full p-2 bg-gray-700 border border-gray-600 rounded mb-2 text-white placeholder-gray-400"
            />
            <Button
              type="submit"
              disabled={creatingPost}
              className="bg-primary/10 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              {creatingPost ? "Опубликовываем..." : "Опубликовать пост"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Link href={`/profile/${username}`}>
          <Button variant="outline">Вернуться в профиль</Button>
        </Link>
      </div>
    </div>
  );
}
