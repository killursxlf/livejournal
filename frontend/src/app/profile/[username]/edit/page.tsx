"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";
import ImageCropper from "@/components/ImageCropper";
import { useToast } from "@/components/ui/use-toast";

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

interface User {
  email: string;
  name?: string;
  bio?: string;
  username?: string;
  avatar?: string;
  error?: string;
}

export default function EditProfile() {
  const { username } = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [error, setError] = useState("");

  const [isCropping, setIsCropping] = useState(false);
  const [tempAvatarPreview, setTempAvatarPreview] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);
  const { toast } = useToast();

  useEffect(() => {
    isMounted.current = true;
    if (username) {
      fetch(`${backendURL}/api/user?username=${username}`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data: User) => {
          if (!isMounted.current) return;
          if (data.error) {
            setError(data.error);
          } else {
            setUser(data);
            if (data.name) {
              const parts = data.name.split(" ");
              setFirstName(parts[0]);
              setLastName(parts.slice(1).join(" "));
            }
            setBio(data.bio || "");
            setNewUsername(data.username || "");
          }
        })
        .catch(() => setError("Ошибка загрузки профиля"));
    }
    return () => {
      isMounted.current = false;
    };
  }, [username]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewURL = URL.createObjectURL(file);
      setTempAvatarPreview(previewURL);
      setIsCropping(true);
    }
  };

  const handleAvatarButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleCropComplete = useCallback((croppedFile: File) => {
    setAvatar(croppedFile);
    const croppedURL = URL.createObjectURL(croppedFile);
    setAvatarPreview(croppedURL);
    setIsCropping(false);
    setTempAvatarPreview("");
  }, []);

  const handleCropCancel = useCallback(() => {
    setIsCropping(false);
    setTempAvatarPreview("");
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setError("Имя не может быть пустым!");
      return;
    }
    if (!user) return;

    const combinedName = `${firstName.trim()} ${lastName.trim()}`.trim();

    let res;
    if (avatar) {
      const formData = new FormData();
      formData.append("avatar", avatar);
      formData.append("email", user.email);
      formData.append("name", combinedName);
      formData.append("bio", bio);
      formData.append("username", newUsername);
      res = await fetch(`${backendURL}/api/update-profile`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
    } else {
      res = await fetch(`${backendURL}/api/update-profile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: combinedName,
          bio,
          username: newUsername,
        }),
      });
    }

    if (res.ok) {
      toast({
        description: "✅ Профиль обновлён!",
        duration: 3000,
      });
      router.push(`/profile/${newUsername}`);
    } else {
      const data = await res.json();
      setError(data.error || "Ошибка при обновлении профиля");
    }
  };

  if (error) return <p className="text-red-500">{error}</p>;
  if (!user) return <p>Загрузка...</p>;

  return (
    <div className="min-h-screen bg-background">
      {isCropping && tempAvatarPreview && (
        <ImageCropper
          imageSrc={tempAvatarPreview}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          minWidth={100}
          minHeight={100}
        />
      )}

      <div className="container py-8">
        <Card className="max-w-2xl mx-auto backdrop-blur-sm bg-black/20 border-white/5">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Редактировать профиль</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="w-32 h-32">
                    <AvatarImage src={avatarPreview || user.avatar || "/placeholder.svg"} />
                    <AvatarFallback>АП</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute bottom-0 right-0 rounded-full"
                    onClick={handleAvatarButtonClick}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="sr-only">Изменить фото</span>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Имя</Label>
                    <Input
                      id="firstName"
                      placeholder="Иван"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-black/20 border-white/10"
                      autoFocus
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Фамилия</Label>
                    <Input
                      id="lastName"
                      placeholder="Иванов"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-black/20 border-white/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="example@mail.com"
                    value={user.email}
                    disabled
                    className="bg-black/20 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="bg-black/20 border-white/10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">О себе</Label>
                  <Textarea
                    id="bio"
                    placeholder="Расскажите о себе..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="min-h-[100px] bg-black/20 border-white/10"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1">
                  Сохранить изменения
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/profile/${username}`)}
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
