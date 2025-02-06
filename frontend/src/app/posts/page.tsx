"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function PostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3000/api/posts")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setPosts(data);
        } else if (data.error) {
          setError(data.error);
        }
      })
      .catch(() => setError("Ошибка при загрузке ленты"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-center text-gray-600">Загрузка ленты...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-center text-red-500">Ошибка: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-extrabold mb-6 text-center text-gray-800">
        Лента рекомендаций
      </h1>

      {posts.length === 0 ? (
        <p className="text-center text-gray-500">Пока нет публикаций в ленте.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <div
              key={post.id}
              className="bg-white shadow-md rounded-lg p-6 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {post.title}
                </h2>
                <p className="mt-2 text-gray-700">{post.content}</p>

                {/* Автор поста */}
                {post.author && (
                  <p className="mt-3 text-sm text-gray-500">
                    Автор:{" "}
                    <Link
                      href={`/profile/${post.author.username}`}
                      className="text-blue-600 hover:underline"
                    >
                      {post.author.name || post.author.username}
                    </Link>
                  </p>
                )}
              </div>

              {/* Теги поста */}
              {post.postTags && post.postTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.postTags.map((pt: any) => (
                    <span
                      key={pt.tag.id}
                      className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full"
                    >
                      {pt.tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
