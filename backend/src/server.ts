import { serve } from "bun";
import {
  register,
  login,
  logout,
  verifyToken,
  verifyUser,
  checkGoogleUser,
} from "./routes/auth";
import {
  getUser,
  completeProfile,
  updateProfile,
} from "./routes/user";
import { corsHeaders } from "./utils/cors";
import { readFile } from "fs/promises";
import { getAllPosts, getPost, createPost, updateDraft, deletePost, searchPosts } from "./routes/posts";
import { toggleLike } from "./routes/like";
import { addComment, DELETE } from "./routes/comment";
import { toggleFollow } from "./routes/follow";
import { toggleSavedPost } from "./routes/savePost";
import { getAllTags } from "./routes/tags";
import { 
  createNotification, 
  getNotifications, 
  markNotificationsAsRead 
} from "./routes/notifications";
import { chatHandler } from "./routes/chat"; // ✅ Подключаем обработчик чатов

serve({
  port: 3000,
  async fetch(req: Request) {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          ...corsHeaders(req),
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    let response: Response;

    if (url.pathname.startsWith("/uploads/")) {
      try {
        const filePath = `./public${url.pathname}`;
        const file = await readFile(filePath);
        response = new Response(file, {
          headers: { "Content-Type": "image/jpeg" },
        });
      } catch (error) {
        response = new Response("Файл не найден", { status: 404 });
      }
    } else {
      try {
        if (url.pathname === "/api/register" && req.method === "POST") {
          response = await register(req);
        } else if (url.pathname === "/api/login" && req.method === "POST") {
          response = await login(req);
        } else if (url.pathname === "/api/logout" && req.method === "POST") {
          response = await logout(req);
        } else if (url.pathname === "/api/complete-profile" && req.method === "POST") {
          response = await completeProfile(req);
        } else if (url.pathname === "/api/user/verify" && req.method === "POST") {
          response = await verifyUser(req);
        } else if (url.pathname === "/api/oauth/google/check" && req.method === "POST") {
          response = await checkGoogleUser(req);
        } else if (url.pathname === "/api/posts" && req.method === "GET") {
          response = await getAllPosts(req);
        } else if (url.pathname === "/api/getpost" && req.method === "GET") {
          response = await getPost(req);
        } else if (url.pathname === "/api/search" && req.method === "GET") {
          response = await searchPosts(req);
        } else if (url.pathname === "/api/get-tags" && req.method === "GET") {
          response = await getAllTags(req);
        } else if (url.pathname === "/api/user" && req.method === "GET") {
          response = await getUser(req);
        } 

        // ✅ API сообщений (чаты)
        else if (url.pathname.startsWith("/api/chat/") && url.pathname.endsWith("/message") && req.method === "POST") {
          response = await chatHandler.sendMessage(req);
        } else if (url.pathname.startsWith("/api/chat/") && url.pathname.endsWith("/messages") && req.method === "GET") {
          response = await chatHandler.getMessages(req);
        } else if (url.pathname.startsWith("/api/chat/") && url.pathname.endsWith("/read") && req.method === "PATCH") {
          response = await chatHandler.markAsRead(req);
        } else if (url.pathname.startsWith("/api/chat/") && url.pathname.endsWith("/forward") && req.method === "POST") {
          response = await chatHandler.forwardMessage(req);
        } 
        // ✅ Новый эндпоинт для получения списка чатов пользователя
        else if (url.pathname.startsWith("/api/user/") && url.pathname.endsWith("/chats") && req.method === "GET") {
          response = await chatHandler.getUserChats(req);
        }

        else {
          const user = await verifyToken(req);
          if (!user) {
            response = new Response(JSON.stringify({ error: "Не авторизован" }), {
              status: 401,
              headers: corsHeaders(req),
            });
          } else if (url.pathname === "/api/like" && req.method === "POST") {
            response = await toggleLike(req);
          } else if (url.pathname === "/api/comment" && req.method === "POST") {
            response = await addComment(req);
          } else if (url.pathname === "/api/comment-delete" && req.method === "POST") {
            const commentId = url.searchParams.get("id");
            if (!commentId) {
              response = new Response(JSON.stringify({ error: "Идентификатор комментария не указан" }), { status: 400 });
            } else {
              response = await DELETE(req, { params: { id: commentId } });
            }
          } else if (url.pathname === "/api/update-profile" && req.method === "POST") {
            response = await updateProfile(req);
          } else if (url.pathname === "/api/create-post" && req.method === "POST") {
            response = await createPost(req);
          } else if (url.pathname === "/api/toggle-follow" && req.method === "POST") {
            response = await toggleFollow(req);
          } else if (url.pathname === "/api/toggle-saved-post" && req.method === "POST") {
            response = await toggleSavedPost(req);
          } else if (url.pathname === "/api/update-post" && req.method === "PUT") {
            response = await updateDraft(req);
          } else if (url.pathname === "/api/delete-post" && req.method === "DELETE") {
            response = await deletePost(req);
          } else if (url.pathname === "/api/notifications" && req.method === "GET") {
            response = await getNotifications(req);
          } else if (url.pathname === "/api/notifications" && req.method === "POST") {
            response = await createNotification(req);
          } else if (url.pathname === "/api/notifications" && req.method === "PUT") {
            response = await markNotificationsAsRead(req);
          } else {
            response = new Response("Страница не найдена", { status: 404 });
          }
        }
      } catch (error) {
        console.error("Ошибка на сервере:", error);
        response = new Response(JSON.stringify({ error: "Ошибка сервера" }), {
          status: 500,
        });
      }
    }

    const mergedHeaders = new Headers(response.headers);
    const cors = corsHeaders(req);
    for (const [key, value] of Object.entries(cors)) {
      mergedHeaders.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      headers: mergedHeaders,
    });
  },
});

console.log("🚀 Bun API работает на http://localhost:3000");
