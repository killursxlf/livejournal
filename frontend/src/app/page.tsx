"use client";

import { BookOpen, MessageSquare, PenLine, Star, Users } from "lucide-react";
import { FeatureCard } from "@/components/FeatureCard";

const features = [
  {
    icon: BookOpen,
    title: "Создавайте дневники",
    description:
      "Делитесь своими мыслями и историями в персональном онлайн-дневнике",
  },
  {
    icon: PenLine,
    title: "Пишите статьи",
    description:
      "Публикуйте статьи на любые темы и делитесь своим опытом",
  },
  {
    icon: MessageSquare,
    title: "Общайтесь",
    description:
      "Обсуждайте записи и находите единомышленников",
  },
  {
    icon: Star,
    title: "Оценивайте",
    description:
      "Ставьте оценки и делитесь мнением о прочитанном",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <section className="container px-4 pt-24 pb-16 text-center animate-fade-in">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            Добро пожаловать в LiveJournal
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Ваша платформа для самовыражения, общения и обмена идеями
          </p>
          <button className="px-8 py-3 bg-primary text-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors duration-300">
            Начать писать
          </button>
        </div>
      </section>

      <section className="container px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Возможности платформы
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </section>

      <section className="container px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Users className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Присоединяйтесь к сообществу
          </h2>
          <p className="text-muted-foreground mb-8">
            Тысячи авторов уже делятся своими историями. Станьте частью нашего сообщества!
          </p>
          <button className="px-6 py-2 bg-background text-primary border-2 border-primary rounded-lg font-medium hover:bg-primary hover:text-foreground transition-colors duration-300">
            Узнать больше
          </button>
        </div>
      </section>
    </div>
  );
}
