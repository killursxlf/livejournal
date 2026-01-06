"use client";

import { HelpCircle, Mail, MessageSquare, Users, PenLine } from "lucide-react";

const faqItems = 
[
  {
    icon: HelpCircle,
    question: "Question 1",
    answer: "Content",
  },
  {
    icon: PenLine,
    question: "Question 2",
    answer: "Content",
  },
  {
    icon: MessageSquare,
    question: "Question 3",
    answer: "Content",
  },
  {
    icon: Users,
    question: "Question 4",
    answer: "Content",
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background/90">
      <section className="container px-4 pt-24 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
          Центр помощи
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Здесь вы найдете ответы на частые вопросы и способы связи с поддержкой.
        </p>
      </section>

      <section className="container px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Часто задаваемые вопросы
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {faqItems.map((item, index) => (
            <div key={index} className="border rounded-lg p-4 bg-background shadow-md transition hover:shadow-lg flex items-start gap-4">
              <item.icon className="w-6 h-6 text-primary flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-foreground">{item.question}</h3>
                <p className="text-sm text-muted-foreground mt-2">{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container px-4 py-16 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Свяжитесь с нами
          </h2>
          <p className="text-muted-foreground mb-8">
            Если у вас остались вопросы, напишите нам, и мы поможем вам разобраться.
          </p>
          <button className="px-6 py-2 bg-primary text-foreground rounded-lg font-medium hover:bg-primary/90 transition">
            Написать в поддержку
          </button>
        </div>
      </section>
    </div>
  );
}
