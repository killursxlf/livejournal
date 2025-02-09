// components/TextEditor.tsx
"use client";

import React from "react";
import { Editor } from "react-draft-wysiwyg";
import { EditorState } from "draft-js";

// Определяем карту стилей
const customStyleMap = {
    "fontsize-8": { fontSize: "8px" },
    "fontsize-9": { fontSize: "9px" },
    "fontsize-10": { fontSize: "10px" },
    "fontsize-11": { fontSize: "11px" },
    "fontsize-12": { fontSize: "12px" },
    "fontsize-14": { fontSize: "14px" },
    "fontsize-16": { fontSize: "16px" },
    "fontsize-18": { fontSize: "18px" },
    "fontsize-24": { fontSize: "24px" },
    "fontsize-30": { fontSize: "30px" },
    "fontsize-36": { fontSize: "36px" },
    "fontsize-48": { fontSize: "48px" },
    "fontsize-60": { fontSize: "60px" },
    "fontsize-72": { fontSize: "72px" },
    "fontsize-96": { fontSize: "96px" },
  
    "fontfamily-arial": { fontFamily: "Arial" },
    "fontfamily-georgia": { fontFamily: "Georgia" },
    "fontfamily-impact": { fontFamily: "Impact" },
    "fontfamily-tahoma": { fontFamily: "Tahoma" },
    "fontfamily-times new roman": { fontFamily: '"Times New Roman"' },
    "fontfamily-verdana": { fontFamily: "Verdana" },
};
  

export interface TextEditorProps {
  editorState: EditorState;
  onEditorStateChange: (editorState: EditorState) => void;
  placeholder?: string;
  className?: string;
}

const TextEditor: React.FC<TextEditorProps> = ({
  editorState,
  onEditorStateChange,
  placeholder = "Введите содержание...",
  className = "",
}) => {
  return (
    <div className={className}>
      <Editor
        editorState={editorState}
        onEditorStateChange={onEditorStateChange}
        placeholder={placeholder}
        customStyleMap={customStyleMap}
        toolbar={{
            options: [
              "fontFamily",
              "fontSize",
              "inline",
              "blockType",
              "list",
              "textAlign",
              "colorPicker",
              "link",
              "embedded",
              "emoji",
              "image",
              "remove",
              "history",
            ],
            fontFamily: {
              options: ["Arial", "Georgia", "Impact", "Tahoma", "Times New Roman", "Verdana"],
            },
            fontSize: {
              options: [8, 9, 10, 11, 12, 14, 16, 18, 24, 30, 36, 48, 60, 72, 96],
            },
            inline: { inDropdown: false },
            list: { inDropdown: false },
            textAlign: { inDropdown: true },
            link: { inDropdown: false },
            history: { inDropdown: false },
          }}          
      />
    </div>
  );
};

export default TextEditor;
