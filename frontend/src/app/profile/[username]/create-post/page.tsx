"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import TitleInput from "@/components/TitleInput";
import TagsInput from "@/components/TagsInput";
import "easymde/dist/easymde.min.css";
import Sidebar from "@/components/Sidebar";
import BackButton from "@/components/BackButton";
import EasyMDE from "easymde";
import { useToast } from "@/components/ui/use-toast";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export default function EditPost() {
  const { data: session } = useSession();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("Article");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");

  const editorRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let easyMDE: EasyMDE | null = null;
    (async () => {
      const { default: EasyMDE } = await import("easymde");
      if (editorRef.current) {
        easyMDE = new EasyMDE({
          element: editorRef.current.querySelector("textarea")!,
          spellChecker: false,
          autofocus: true,
          placeholder: "Start writing your post...",
          toolbar: [
            "bold",
            "italic",
            "heading",
            "|",
            "quote",
            "unordered-list",
            "ordered-list",
            "|",
            "link",
            "image",
            "|",
            "preview",
            "side-by-side",
            "fullscreen",
            "|",
            "guide",
          ],
          minHeight: "300px",
        });

        // При изменении содержимого редактора обновляем состояние content
        easyMDE.codemirror.on("change", () => {
          setContent(easyMDE!.value());
        });
  
        // Применение кастомных стилей после инициализации EasyMDE
        const cmElement = editorRef.current.querySelector(".CodeMirror") as HTMLElement;
        if (cmElement) {
          cmElement.style.backgroundColor = "hsl(var(--muted))";
          cmElement.style.color = "hsl(var(--foreground))";
        }
      }
    })();

    return () => {
      if (easyMDE) {
        easyMDE.toTextArea();
        easyMDE.cleanup();
      }
    };
  }, []);

  const submitPost = async (status: "PUBLISHED" | "DRAFT") => {
    const publicationTypeMapping: Record<string, string> = {
      Article: "ARTICLE",
      News: "NEWS",
      Review: "REVIEW",
    };

    const payload = {
      title,
      content,
      email: session?.user?.email,
      tags,
      status,
      publicationType: publicationTypeMapping[postType],
      publishDate,
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
        toast({
          description: "Пост успешно создан",
          duration: 3000,
        });
        router.push("/posts");
      } else {
        console.error("Ошибка создания поста:", data.error);
      }
    } catch (error) {
      console.error("Ошибка создания поста:", error);
    }
  };

  const handlePublish = () => {
    submitPost("PUBLISHED");
  };

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
          <div className="flex-grow space-y-6 animate-fade-up">
            <TitleInput
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <TagsInput value={tags} onChange={setTags} />
            <div ref={editorRef} className="w-full bg-muted rounded-lg overflow-hidden">
              <textarea className="w-full" />
            </div>
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
