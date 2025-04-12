"use client";

import { CommunityCard } from "@/app/communities/CommunityCard";
import { useRouter } from "next/navigation";

const communities = 
[
  {
    name: "Computer science",
    description: "Обсуждаем IT, программирование, стартапы и инновации.",
    members: 3200,
  },
  {
    name: "Искусство",
    description: "Место для творческих людей: живопись, музыка, кино.",
    members: 1800,
  },
  {
    name: "Путешествия",
    description: "Делимся историями из поездок и советами по путешествиям.",
    members: 2500,
  },
];

export default function CommunitiesPage() {
  const router = useRouter();

  const handleClick = () => {
    router.push("/communities/search");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <section className="container px-4 pt-24 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          Добро пожаловать в сообщества!
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Найдите сообщество по интересам и присоединяйтесь к обсуждениям.
        </p>
        <button 
        onClick={handleClick}
        className="px-8 py-3 bg-primary text-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors duration-300">
          Перейти к сообществам
        </button>
      </section>

      <section className="container px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Популярные сообщества
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.map((community, index) => (
            <CommunityCard
              key={index}
              name={community.name}
              description={community.description}
              members={community.members}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
