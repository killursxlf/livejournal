"use client";

import Link from "next/link";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { User, Search } from "lucide-react";
import { Button } from "./ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuLink,
} from "./ui/navigation-menu";
import { DefaultUser } from "next-auth";

interface CustomUser extends DefaultUser {
  avatar?: string;
  username?: string;
}

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

const Header = () => {
  const { data: session } = useSession();

  const user = session?.user as CustomUser | null;
  let avatar = user?.avatar || user?.image;
  if (avatar && avatar.startsWith("/")) {
    avatar = `${backendURL}${avatar}`;
  }

  const username = user?.username || "";
  const profileLink = session && username ? `/profile/${encodeURIComponent(username)}` : "/login";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/50 backdrop-blur-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Логотип */}
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            LiveJournal
          </Link>
        </div>

        {/* Навигация */}
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

        {/* Действия */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-foreground hover:bg-accent">
            <Search className="h-5 w-5" />
          </Button>

          {/* Кнопка для профиля/входа с динамическим переходом */}
          <Button asChild variant="ghost" size="icon" className="text-foreground hover:bg-accent">
            <Link href={profileLink}>
              <User className="h-5 w-5" />
            </Link>
          </Button>

          {session ? (
            <div className="flex items-center gap-4">
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
