"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface NotificationType {
  id: string;
  message: string;
  senderName: string;
  senderId: string; // Добавлено для ссылки на профиль отправителя
  type: string;
  createdAt: string; 
  isRead: boolean;
}

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

export function NotificationsPopover() {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchNotifications() {
      try {
        const res = await fetch(`${backendUrl}/api/notifications`, {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications);
        } else {
          console.error("Ошибка при получении уведомлений");
        }
      } catch (error) {
        console.error("Ошибка при получении уведомлений:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleMarkAllAsRead() {
    const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length === 0) return;
    try {
      const res = await fetch(`${backendUrl}/api/notifications`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: unreadIds }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
      } else {
        console.error("Ошибка при пометке уведомлений как прочитанных");
      }
    } catch (error) {
      console.error("Ошибка при пометке уведомлений как прочитанных:", error);
    }
  }

  async function handleNotificationClick(notificationId: string, senderName: string) {
    try {
      const notification = notifications.find(n => n.id === notificationId);
      // Если уведомление ещё не прочитано – помечаем его
      if (notification && !notification.isRead) {
        const res = await fetch(`${backendUrl}/api/notifications`, {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationIds: [notificationId] }),
        });
        if (res.ok) {
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === notificationId ? { ...n, isRead: true } : n
            )
          );
        } else {
          console.error("Ошибка при пометке уведомления как прочитанного");
        }
      }
      // Переход на страницу профиля отправителя
      router.push(`/profile/${senderName}`);
    } catch (error) {
      console.error("Ошибка при обработке уведомления:", error);
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 z-[9999] bg-[#12161f]" align="end">
        <div className="border-b border-border px-4 py-3">
          <h4 className="text-sm font-semibold">Notifications</h4>
        </div>
        <ScrollArea className="h-[calc(100vh-20rem)] min-h-[250px]">
          <div className="flex flex-col gap-1 p-1">
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-4">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.senderName)}
                  className={cn(
                    "flex flex-col gap-1 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent w-full",
                    !notification.isRead && "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span>{notification.message}</span>
                    {!notification.isRead && (
                      <span className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            className="w-full justify-center text-xs"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
