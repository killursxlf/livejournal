// components/TextEditor.tsx
"use client";

import React from "react";
import { Editor } from "react-draft-wysiwyg";
import { EditorState } from "draft-js";

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
        toolbar={{
          options: [
            "inline",
            "blockType",
            "fontSize",
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
