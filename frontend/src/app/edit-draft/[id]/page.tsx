"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import TitleInput from "@/components/TitleInput";
import TagsInput from "@/components/TagsInput";
import Editor from "@/components/Editor";
import Sidebar from "@/components/Sidebar";
import BackButton from "@/components/BackButton";
import { useToast } from "@/hooks/use-toast"; // Импортируем ваш useToast

interface VersionType {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  tags?: string[];
  postType?: string;
  publishDate?: string;
  publishTime?: string;
}

export default function EditDraft() {
  const params = useParams();
  // Получаем идентификатор поста из параметров маршрута
  const { id } = params;
  const router = useRouter();
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [content, setContent] = useState("");
  // postType в UI формате, например "Article"
  const [postType, setPostType] = useState("Article");
  const [publishDate, setPublishDate] = useState("");
  const [publishTime, setPublishTime] = useState("");
  // Состояние для версий поста
  const [versions, setVersions] = useState<VersionType[]>([]);
  // Сохраняем актуальную версию для возможности возврата
  const [currentVersion, setCurrentVersion] = useState<{
    title: string;
    content: string;
    tags: string[];
    postType: string;
    publishDate: string;
    publishTime: string;
  } | null>(null);

  // Мэппинг UI-значения в значение для БД
  const publicationTypeMapping = useMemo(
    () => ({
      Article: "ARTICLE",
      News: "NEWS",
      Review: "REVIEW",
    }),
    []
  );

  // Инициализация useToast
  const { toast } = useToast();

  // Загрузка данных черновика
  useEffect(() => {
    if (id) {
      fetch(`${backendURL}/api/getpost?id=${id}`, { credentials: "include" })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            console.error(data.error);
          } else {
            setTitle(data.title);
            setContent(data.content);
            setTags(
              data.postTags
                ? data.postTags.map((pt: { tag: { name: string } }) => pt.tag.name)
                : []
            );
            // Преобразуем тип с бэка в UI-формат
            setPostType(
              data.publicationType === "ARTICLE"
                ? "Article"
                : data.publicationType === "NEWS"
                ? "News"
                : data.publicationType === "REVIEW"
                ? "Review"
                : data.publicationType
            );
            if (data.publishAt) {
              const d = new Date(data.publishAt);
              setPublishDate(d.toISOString().split("T")[0]);
              setPublishTime(d.toISOString().split("T")[1].slice(0, 5));
            }
            setCurrentVersion({
              title: data.title,
              content: data.content,
              tags: data.postTags
                ? data.postTags.map((pt: { tag: { name: string } }) => pt.tag.name)
                : [],
              postType:
                data.publicationType === "ARTICLE"
                  ? "Article"
                  : data.publicationType === "NEWS"
                  ? "News"
                  : data.publicationType === "REVIEW"
                  ? "Review"
                  : data.publicationType,
              publishDate: data.publishAt
                ? new Date(data.publishAt).toISOString().split("T")[0]
                : "",
              publishTime: data.publishAt
                ? new Date(data.publishAt).toISOString().split("T")[1].slice(0, 5)
                : "",
            });
            setVersions(data.postVersions || []);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [id, backendURL]);

  // Функция для загрузки выбранной версии
  const onSelectVersion = (versionId: string) => {
    const selectedVersion = versions.find((v) => v.id === versionId);
    if (selectedVersion) {
      setTitle(selectedVersion.title);
      setContent(selectedVersion.content);
      if (selectedVersion.tags) setTags(selectedVersion.tags);
      if (selectedVersion.postType) setPostType(selectedVersion.postType);
      if (selectedVersion.publishDate) setPublishDate(selectedVersion.publishDate);
      if (selectedVersion.publishTime) setPublishTime(selectedVersion.publishTime);
    }
  };

  // Функция для возврата к актуальной версии
  const onResetVersion = () => {
    if (currentVersion) {
      setTitle(currentVersion.title);
      setContent(currentVersion.content);
      setTags(currentVersion.tags);
      setPostType(currentVersion.postType);
      setPublishDate(currentVersion.publishDate);
      setPublishTime(currentVersion.publishTime);
    }
  };

  // Функция сохранения черновика со статусом DRAFT
  const saveDraft = async () => {
    const payload = {
      id,
      title,
      content,
      tags,
      publicationType:
        publicationTypeMapping[postType as keyof typeof publicationTypeMapping] || postType,
      publishDate,
      publishTime,
      status: "DRAFT",
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
        toast({ title: "Success", description: data.message || "Черновик сохранён" });
      } else {
        toast({ title: "Error", description: data.error || "Ошибка сохранения черновика" });
      }
    } catch (error) {
      console.error("Ошибка сохранения черновика:", error);
      toast({ title: "Error", description: "Ошибка сохранения черновика" });
    }
  };

  // Функция публикации поста со статусом PUBLISHED
  const publishPost = async () => {
    const payload = {
      id,
      title,
      content,
      tags,
      publicationType:
        publicationTypeMapping[postType as keyof typeof publicationTypeMapping] || postType,
      publishDate,
      publishTime,
      status: "PUBLISHED",
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
        toast({ title: "Success", description: data.message || "Пост опубликован" });
        if (data.author && data.author.username) {
          router.push(`/profile/${data.author.username}`);
        } else {
          console.error("Отсутствует информация об авторе в ответе", data);
        }
      } else {
        toast({ title: "Error", description: data.error || "Ошибка публикации поста" });
      }
    } catch (error) {
      console.error("Ошибка публикации поста:", error);
      toast({ title: "Error", description: "Ошибка публикации поста" });
    }
  };

  if (loading) return <p>Загрузка черновика...</p>;

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
            onPublish={publishPost}
            onSaveDraft={saveDraft}
            versions={versions}
            onSelectVersion={onSelectVersion}
            onResetVersion={onResetVersion}
          />
        </div>
      </main>
    </div>
  );
}
