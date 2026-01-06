"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { Search, X } from "lucide-react";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "./ui/navigation-menu";
import { DefaultUser } from "next-auth";
import { useState } from "react";
import { Input } from "./ui/input";
import { useRouter } from "next/navigation";
import { NotificationsPopover } from "@/components/NotificationPopover";

interface CustomUser extends DefaultUser {
  avatar?: string;
  username?: string;
}

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

const Header = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const user = session?.user as CustomUser | null;
  let avatar = user?.avatar || user?.image;
  if (avatar && avatar.startsWith("/")) {
    avatar = `${backendURL}${avatar}`;
  }

  const username = user?.username || "";
  const profileLink =
    session && username ? `/profile/${encodeURIComponent(username)}` : "/login";

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            LiveJournal
          </Link>
        </div>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/posts"
                className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                Посты
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/communities"
                className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                Сообщества
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/help"
                className="group inline-flex h-9 w-max items-center justify-center rounded-md bg-background/60 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
              >
                Помощь
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <div className="flex items-center gap-4">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="search"
              placeholder="Поиск..."
              className={`
                w-0 px-0 bg-background border-primary/20 transition-all duration-300 absolute right-0
                ${isSearchOpen ? "w-72 px-3 border-opacity-100" : "border-opacity-0"}
              `}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                pointerEvents: isSearchOpen ? "auto" : "none",
                opacity: isSearchOpen ? 1 : 0,
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-foreground hover:bg-accent relative z-10"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>
          </form>
          {session ? (
            <div className="flex items-center gap-4">
              <NotificationsPopover />
              <Link href={profileLink} className="flex items-center gap-2">
                {avatar && (
                  <Image
                    src={avatar}
                    alt="Аватар"
                    width={32}
                    height={32}
                    className="rounded-full border"
                  />
                )}
                <span className="text-foreground">{user?.name || "Профиль"}</span>
              </Link>
              <Button
                onClick={() => signOut()}
                variant="outline"
                className="border-primary/50 text-foreground hover:bg-accent"
              >
                Выйти
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Button
                onClick={() => signIn()}
                variant="outline"
                className="border-primary/50 text-foreground hover:bg-accent"
              >
                Войти
              </Button>
              <Link href="/register">
                <Button className="bg-primary text-foreground hover:bg-accent/80">
                  Регистрация
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
