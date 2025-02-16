"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import TitleInput from "@/components/TitleInput";
import TagsInput from "@/components/TagsInput";
import "easymde/dist/easymde.min.css";
import Sidebar, { VersionType } from "@/components/Sidebar";
import BackButton from "@/components/BackButton";
import EasyMDE from "easymde";
import { useToast } from "@/components/ui/use-toast";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface PostResponse {
  title: string;
  content: string;
  postTags: { tag: { name: string } }[];
  postType: string;
  publishDate: string;
  publishTime: string;
  postVersions: VersionType[];
}

export default function EditDraft() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id; 

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [postType, setPostType] = useState("Article");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  const [versions, setVersions] = useState<VersionType[]>([]);
  const [currentDraft, setCurrentDraft] = useState<{ title: string; content: string } | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);
  const [easyMDEInstance, setEasyMDEInstance] = useState<EasyMDE | null>(null);

  useEffect(() => {
    let easyMDE: EasyMDE | null = null;

    (async () => {
      const { default: EasyMDE } = await import("easymde");
      if (editorRef.current) {
        easyMDE = new EasyMDE({
          element: editorRef.current.querySelector("textarea")!,
          spellChecker: false,
          autofocus: true,
          placeholder: "Начните писать ваш пост...",
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
        setEasyMDEInstance(easyMDE);

        easyMDE.codemirror.on("change", () => {
          setContent(easyMDE!.value());
        });

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

  useEffect(() => {
    if (!id) {
      console.log("ID отсутствует, GET-запрос не выполняется");
      return;
    }
    console.log("Выполняем GET-запрос для id:", id);

    fetch(`${backendURL}/api/getpost?id=${id}`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data: PostResponse) => {
        console.log("Получены данные:", data);
        setTitle(data.title || "");
        setContent(data.content || "");
        setCurrentDraft({
          title: data.title || "",
          content: data.content || "",
        });
        setTags(
          (data.postTags || []).map(
            (item: { tag: { name: string } }) => item.tag.name
          )
        );
        setPostType(data.postType || "Article");
        setPublishDate(data.publishDate || "");
        setPublishTime(data.publishTime || "");

        setVersions(data.postVersions || []);

        if (easyMDEInstance) {
          easyMDEInstance.value(data.content || "");
        }
      })
      .catch((err) => {
        console.error("Ошибка получения данных поста:", err);
      });
  }, [id, easyMDEInstance]);

  const handleVersionSelect = (version: VersionType) => {
    setTitle(version.title || "");
    setContent(version.content || "");
    if (easyMDEInstance) {
      easyMDEInstance.value(version.content || "");
    }
  };

  const handleRestoreCurrentVersion = () => {
    if (currentDraft) {
      setTitle(currentDraft.title);
      setContent(currentDraft.content);
      if (easyMDEInstance) {
        easyMDEInstance.value(currentDraft.content);
      }
    }
  };

  const updatePost = async (status: "PUBLISHED" | "DRAFT") => {
    const publicationTypeMapping: Record<string, string> = {
      Article: "ARTICLE",
      News: "NEWS",
      Review: "REVIEW",
    };

    const payload = {
      id,
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
      const res = await fetch(`${backendURL}/api/update-post`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          description: "Пост успешно обновлен",
          duration: 3000,
        });
        router.push("/posts");
      } else {
        console.error("Ошибка обновления поста:", data.error);
      }
    } catch (error) {
      console.error("Ошибка обновления поста:", error);
    }
  };

  const handlePublish = () => {
    updatePost("PUBLISHED");
  };

  const handleSaveDraft = () => {
    updatePost("DRAFT");
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-16 flex-shrink-0">
            <BackButton />
          </div>
          <div className="flex-grow space-y-6 animate-fade-up">
            <TitleInput value={title} onChange={(e) => setTitle(e.target.value)} />
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
            versions={versions}
            onSelectVersion={handleVersionSelect}
            onRestoreCurrent={handleRestoreCurrentVersion}
          />
        </div>
      </main>
    </div>
  );
}
