"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Image as ImageIcon, X, Upload, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";
import ImageCropper from "@/components/ImageCropper"; // Проверьте путь импорта

const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

const categories = [
  { id: "1", name: "Путешествия и отдых" },
  { id: "2", name: "Технологии" },
  { id: "3", name: "Искусство и фотография" },
  { id: "4", name: "Спорт" },
  { id: "5", name: "Здоровье и фитнес" },
  { id: "6", name: "Кулинария" },
  { id: "7", name: "Литература" },
  { id: "8", name: "Музыка" },
  { id: "9", name: "Кино и сериалы" },
  { id: "10", name: "Образование" },
  { id: "11", name: "Бизнес и финансы" },
];

const CreateCommunity = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Текстовые поля формы
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [rules, setRules] = useState([{ text: "" }]);

  // Для превью изображений
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [avatarImage, setAvatarImage] = useState<string | null>(null);

  // Для файлов, которые будут отправлены
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Состояния ошибок
  const [nameError, setNameError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [categoryError, setCategoryError] = useState("");

  // Состояния для работы с обрезкой изображений
  const [rawCoverImage, setRawCoverImage] = useState<string | null>(null);
  const [rawAvatarImage, setRawAvatarImage] = useState<string | null>(null);
  const [showCoverCropper, setShowCoverCropper] = useState(false);
  const [showAvatarCropper, setShowAvatarCropper] = useState(false);

  // Функция для обработки добавления правила
  const addRule = () => {
    setRules([...rules, { text: "" }]);
  };

  // Удаление правила
  const removeRule = (index: number) => {
    if (rules.length > 1) {
      const newRules = [...rules];
      newRules.splice(index, 1);
      setRules(newRules);
    }
  };

  // Изменение правила
  const updateRule = (index: number, text: string) => {
    const newRules = [...rules];
    newRules[index] = { text };
    setRules(newRules);
  };

  // Обработка загрузки фонового изображения
  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRawCoverImage(event.target.result as string);
          setShowCoverCropper(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Обработка загрузки аватарки
  const handleAvatarImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRawAvatarImage(event.target.result as string);
          setShowAvatarCropper(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Завершение обрезки фонового изображения
  const handleCoverCropComplete = (croppedFile: File) => {
    const url = URL.createObjectURL(croppedFile);
    setCoverImage(url);
    setCoverFile(croppedFile);
    setShowCoverCropper(false);
    setRawCoverImage(null);
  };

  // Завершение обрезки аватарки
  const handleAvatarCropComplete = (croppedFile: File) => {
    const url = URL.createObjectURL(croppedFile);
    setAvatarImage(url);
    setAvatarFile(croppedFile);
    setShowAvatarCropper(false);
    setRawAvatarImage(null);
  };

  // Отмена обрезки
  const cancelCoverCrop = () => {
    setShowCoverCropper(false);
    setRawCoverImage(null);
  };

  const cancelAvatarCrop = () => {
    setShowAvatarCropper(false);
    setRawAvatarImage(null);
  };

  // Удаление превью
  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverFile(null);
  };

  const removeAvatarImage = () => {
    setAvatarImage(null);
    setAvatarFile(null);
  };

  // Валидация формы
  const validateForm = () => {
    let isValid = true;

    if (!name.trim()) {
      setNameError("Название сообщества обязательно");
      isValid = false;
    } else if (name.length < 3) {
      setNameError("Название должно быть не менее 3 символов");
      isValid = false;
    } else {
      setNameError("");
    }

    if (!description.trim()) {
      setDescriptionError("Описание сообщества обязательно");
      isValid = false;
    } else if (description.length < 20) {
      setDescriptionError("Описание должно быть не менее 20 символов");
      isValid = false;
    } else {
      setDescriptionError("");
    }

    if (!category) {
      setCategoryError("Выберите категорию");
      isValid = false;
    } else {
      setCategoryError("");
    }

    return isValid;
  };

  // Отправка формы с использованием FormData (файлы отправляются, а не только URL)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;
    setIsSubmitting(true);

    const rulesText = rules.map(rule => rule.text).join("\n");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("rules", rulesText);
    formData.append("categoryId", category);
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }
    if (coverFile) {
      formData.append("background", coverFile);
    }

    try {
      const res = await fetch(`${backendURL}/api/community/create`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Не удалось создать сообщество");
      }

      toast({ title: "Сообщество успешно создано!" });
      router.push("/community");
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast({ title: error.message || "Ошибка создания сообщества" });
      } else {
        toast({ title: "Ошибка создания сообщества" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {showCoverCropper && rawCoverImage && (
        <ImageCropper
          imageSrc={rawCoverImage}
          onCropComplete={handleCoverCropComplete}
          onCancel={cancelCoverCrop}
          minWidth={1200}
          minHeight={300}
          aspect={1200 / 300} // Соотношение 4:1 для фонового изображения
        />
      )}
      {showAvatarCropper && rawAvatarImage && (
        <ImageCropper
          imageSrc={rawAvatarImage}
          onCropComplete={handleAvatarCropComplete}
          onCancel={cancelAvatarCrop}
          minWidth={200}
          minHeight={200}
          aspect={1} // Квадратное соотношение для аватарки
        />
      )}

      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 animate-fade-in">Создать сообщество</h1>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Превью сообщества */}
            <Card className="backdrop-blur-sm bg-black/20 border-white/5 overflow-hidden shadow-lg animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Предпросмотр
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full h-48 rounded-md overflow-hidden mb-6 bg-muted">
                  {coverImage ? (
                    <>
                      <div className="relative w-full h-full">
                        <Image src={coverImage} alt="Community cover" fill className="object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={removeCoverImage}
                        className="absolute top-2 right-2 bg-black/60 p-1 rounded-full hover:bg-black/80 transition-colors"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full w-full bg-muted text-muted-foreground">
                      <ImageIcon className="h-12 w-12 opacity-50" />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-4 border-background">
                      {avatarImage ? (
                        <AvatarImage src={avatarImage} alt="Community avatar" />
                      ) : (
                        <AvatarFallback className="bg-primary/20 text-lg">
                          {name ? name.charAt(0).toUpperCase() : "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    {avatarImage && (
                      <button
                        type="button"
                        onClick={removeAvatarImage}
                        className="absolute -top-1 -right-1 bg-black/60 p-1 rounded-full hover:bg-black/80 transition-colors"
                      >
                        <X className="h-3 w-3 text-white" />
                      </button>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{name || "Название сообщества"}</h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      0 участников
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Основная информация */}
            <Card className="backdrop-blur-sm bg-black/20 border-white/5 overflow-hidden shadow-lg animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Основная информация
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Название сообщества*</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Введите название сообщества"
                    className={nameError ? "border-red-500" : ""}
                  />
                  {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Описание сообщества*</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Расскажите о вашем сообществе..."
                    className={`min-h-[120px] resize-y ${descriptionError ? "border-red-500" : ""}`}
                  />
                  {descriptionError && <p className="text-red-500 text-sm">{descriptionError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Категория*</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className={categoryError ? "border-red-500" : ""}>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border-white/10">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {categoryError && <p className="text-red-500 text-sm">{categoryError}</p>}
                </div>
              </CardContent>
            </Card>

            {/* Медиа */}
            <Card className="backdrop-blur-sm bg-black/20 border-white/5 overflow-hidden shadow-lg animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                  Медиа
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="cover">Фоновое изображение</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() => document.getElementById("cover-upload")?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Загрузить обложку
                    </Button>
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground">Рекомендуемый размер: 1200 x 300 пикселей</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="avatar">Аватар сообщества</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                    >
                      <Upload className="h-4 w-4" />
                      Загрузить аватар
                    </Button>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarImageUpload}
                      className="hidden"
                    />
                    <p className="text-sm text-muted-foreground">Рекомендуемый размер: 200 x 200 пикселей</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Правила сообщества */}
            <Card className="backdrop-blur-sm bg-black/20 border-white/5 overflow-hidden shadow-lg animate-fade-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Правила сообщества
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Добавьте правила, которым должны следовать участники вашего сообщества
                </p>
                {rules.map((rule, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={rule.text}
                      onChange={(e) => updateRule(index, e.target.value)}
                      placeholder={`Правило ${index + 1}`}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeRule(index)}
                      disabled={rules.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addRule} className="w-full mt-2">
                  Добавить правило
                </Button>
              </CardContent>
            </Card>

            {/* Кнопки действий */}
            <CardFooter className="flex justify-end gap-4 p-0">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Создание..." : "Создать сообщество"}
              </Button>
            </CardFooter>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CreateCommunity;
