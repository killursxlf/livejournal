"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

const calculatePasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength += 25;
  if (password.match(/[A-Z]/)) strength += 25;
  if (password.match(/[0-9]/)) strength += 25;
  if (password.match(/[^A-Za-z0-9]/)) strength += 25;
  return strength;
};

const getPasswordStrengthText = (strength: number): string => {
  if (strength === 0) return "";
  if (strength <= 25) return "Слабый";
  if (strength <= 50) return "Средний";
  if (strength <= 75) return "Хороший";
  return "Сильный";
};

const getPasswordStrengthColor = (strength: number): string => {
  if (strength <= 25) return "bg-red-500";
  if (strength <= 50) return "bg-yellow-500";
  if (strength <= 75) return "bg-blue-500";
  return "bg-green-500";
};

export default function CompleteProfileClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const nameFromGoogle = searchParams.get("name");

  const [formData, setFormData] = useState({
    firstName: nameFromGoogle || "",
    lastName: "",
    username: "",
    password: "",
    confirmPassword: "",
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (!email) {
      router.push("/");
    }
  }, [email, router]);

  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(formData.password));
  }, [formData.password]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "Имя обязательно";
    if (!formData.lastName.trim()) newErrors.lastName = "Фамилия обязательна";

    if (!formData.username.trim()) {
      newErrors.username = "Имя пользователя обязательно";
    } else if (formData.username.length < 3) {
      newErrors.username = "Имя пользователя должно быть не менее 3 символов";
    }

    if (!formData.password) {
      newErrors.password = "Пароль обязателен";
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль должен быть не менее 6 символов";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Подтвердите пароль";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Пароли не совпадают";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`;

      const res = await fetch(`${backendURL}/api/complete-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name: fullName,
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: "Профиль обновлен",
          description: "Ваша информация успешно сохранена",
        });
        router.push("/posts");
      } else {
        setErrors({ general: data.error || "Ошибка завершения регистрации" });
      }
    } catch (error) {
      console.error("Ошибка:", error);
      setErrors({ general: "Ошибка завершения регистрации" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md backdrop-blur-sm bg-black/20 border-white/5">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl font-bold text-white">
              Завершите регистрацию
            </CardTitle>
            <CardDescription className="text-gray-300">
              Пожалуйста, заполните дополнительную информацию о себе
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-white">
                    Имя
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="Иван"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="bg-black/20 border-white/10 text-white placeholder:text-gray-400"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-white">
                    Фамилия
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Иванов"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="bg-black/20 border-white/10 text-white placeholder:text-gray-400"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-white">
                  Имя пользователя
                </Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="bg-black/20 border-white/10 text-white placeholder:text-gray-400"
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Пароль
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-black/20 border-white/10 text-white"
                />

                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-300">
                        Сложность пароля: {getPasswordStrengthText(passwordStrength)}
                      </span>
                    </div>

                    {/* Progress в shadcn обычно красится через indicator, но оставляю как у тебя */}
                    <Progress
                      value={passwordStrength}
                      className={`h-1 ${getPasswordStrengthColor(passwordStrength)}`}
                    />
                  </div>
                )}

                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  Подтвердите пароль
                </Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="bg-black/20 border-white/10 text-white"
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {errors.general && (
                <p className="text-sm text-red-500">{errors.general}</p>
              )}

              <Button type="submit" className="w-full">
                Сохранить
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
