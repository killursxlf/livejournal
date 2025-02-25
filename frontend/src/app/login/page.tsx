"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FaGoogle } from "react-icons/fa";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.id) {
      router.push(`/profile/${session.user.username}`);
    }
  }, [status, session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      identifier,
      password,
    });

    setLoading(false);

    if (result?.error) {
      setError(result.error || "Ошибка входа");
      return;
    }

  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container flex items-start justify-center pt-8 min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md backdrop-blur-sm bg-black/20 border-white/5">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold">Авторизация</CardTitle>
            <CardDescription>
              Войдите в свой аккаунт для продолжения
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="text-red-500 text-center">{error}</p>}
              <div className="space-y-2">
                <Label htmlFor="email">Email или @username</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="example@mail.com или @username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="bg-black/20 border-white/10"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/20 border-white/10"
                  required
                />
              </div>
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Входим..." : "Войти"}
              </Button>
            </form>
            <div className="mt-4 space-y-2">
              <Button
                type="button"
                onClick={() => signIn("google", { redirect: false })}
                className="w-full bg-white hover:bg-gray-200 text-black flex items-center justify-center gap-2"
                disabled={loading}
              >
                <FaGoogle className="w-5 h-5" />
                Войти через Google
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Нет аккаунта?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Зарегистрироваться
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
