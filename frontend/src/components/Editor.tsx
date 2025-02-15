"use client";

import { useEffect, useRef } from "react";
import EasyMDE from "easymde";
import "easymde/dist/easymde.min.css";

interface EditorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function Editor({ value, onChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const easyMDERef = useRef<EasyMDE | null>(null);

  useEffect(() => {
    if (editorRef.current && !easyMDERef.current) {
      easyMDERef.current = new EasyMDE({
        element: editorRef.current.querySelector("textarea")!,
        initialValue: value,
        spellChecker: false,
        placeholder: "Start writing your post...",
        toolbar: [
          "bold",
          "italic",
          "heading",
          "|",
          "quote",
          "unordered-list",
          "ordered-list",
          "|",
          "link",
          "image",
          "|",
          "preview",
          "side-by-side",
          "fullscreen",
          "|",
          "guide",
        ],
        minHeight: "300px",
        lineWrapping: true,
      });

      // Программно устанавливаем фокус
      setTimeout(() => {
        easyMDERef.current?.codemirror.focus();
      }, 0);

      // Применяем кастомные стили для CodeMirror
      const cmElement = editorRef.current.querySelector(".CodeMirror") as HTMLElement;
      if (cmElement) {
        cmElement.style.backgroundColor = "hsl(var(--muted))";
        cmElement.style.color = "hsl(var(--foreground))";
        cmElement.style.direction = "ltr";
        cmElement.style.unicodeBidi = "normal";
        cmElement.style.textAlign = "left";
      }

      // Подписываемся на событие изменения редактора и добавляем лог
      easyMDERef.current.codemirror.on("change", () => {
        const newValue = easyMDERef.current!.value();
        console.log("Editor changed. New value:", newValue);
        onChange(newValue);
      });
    } else if (easyMDERef.current) {
      // Если значение изменилось извне, обновляем редактор
      if (value !== easyMDERef.current.value()) {
        easyMDERef.current.value(value);
      }
    }

    return () => {
      if (easyMDERef.current) {
        easyMDERef.current.toTextArea();
        easyMDERef.current.cleanup();
        easyMDERef.current = null;
      }
    };
  }, [value, onChange]);

  return (
    <div ref={editorRef} className="w-full bg-muted rounded-lg overflow-hidden">
      <textarea className="w-full border border-[#141414] text-left" />
    </div>
  );
}
