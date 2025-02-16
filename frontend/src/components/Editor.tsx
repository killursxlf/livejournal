"use client";

import { useLayoutEffect, useRef } from "react";
import "easymde/dist/easymde.min.css";
import type EasyMDEType from "easymde";

interface EditorProps {
  value: string;
  onChange: (val: string) => void;
}

export default function Editor({ value, onChange }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const easyMDERef = useRef<EasyMDEType | null>(null);

  useLayoutEffect(() => {
    if (typeof window !== "undefined" && editorRef.current && !easyMDERef.current) {
      import("easymde").then((module) => {
        const EasyMDE = module.default as typeof module.default;
        const textarea = editorRef.current?.querySelector("textarea");
        if (!textarea) return;
        easyMDERef.current = new EasyMDE({
          element: textarea,
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

        // Устанавливаем фокус и делаем refresh после небольшой задержки
        setTimeout(() => {
          easyMDERef.current?.codemirror.focus();
          easyMDERef.current?.codemirror.refresh();
        }, 100);

        const cmElement = editorRef.current?.querySelector(".CodeMirror") as HTMLElement | null;
        if (cmElement) {
          cmElement.style.backgroundColor = "hsl(var(--muted))";
          cmElement.style.color = "hsl(var(--foreground))";
          cmElement.style.direction = "ltr";
          cmElement.style.unicodeBidi = "normal";
          cmElement.style.textAlign = "left";
        }

        easyMDERef.current.codemirror.on("change", () => {
          const newValue = easyMDERef.current?.value() ?? "";
          console.log("Editor changed. New value:", newValue);
          onChange(newValue);
        });
      });
    } else if (easyMDERef.current) {
      if (value !== easyMDERef.current.value()) {
        easyMDERef.current.value(value);
        // Обновляем CodeMirror после программного обновления значения
        easyMDERef.current.codemirror.refresh();
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
