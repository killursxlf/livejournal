import { useState } from "react";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
}

export default function TagsInput({ value, onChange }: TagsInputProps) {
  const popularTags: string[] = ["Technology", "Travel", "Food", "Lifestyle", "Health"];
  const [inputValue, setInputValue] = useState<string>("");

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Если нажата клавиша пробела или запятая, пытаемся добавить тег(и)
    if (e.key === " " || e.key === ",") {
      e.preventDefault();
      if (inputValue.trim() !== "") {
        // Если введено несколько тегов через запятую, разделяем их
        const tagsFromInput = inputValue.split(",").map(t => t.trim()).filter(t => t !== "");
        tagsFromInput.forEach(addTag);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && inputValue === "") {
      // Удаляем последний тег, если поле пустое и нажата Backspace
      onChange(value.slice(0, -1));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const togglePopularTag = (tag: string) => {
    if (value.includes(tag)) {
      onChange(value.filter((t) => t !== tag));
    } else {
      onChange([...value, tag]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Отображение выбранных тегов */}
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span key={tag} className="px-2 py-1 text-sm bg-primary text-white rounded-md">
            {tag}
          </span>
        ))}
      </div>
      {/* Поле ввода для добавления нового тега */}
      <input
        type="text"
        placeholder="Add tags (separate with comma or space)"
        value={inputValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent border-b border-[#2a3142] focus:border-[#6959a0] focus:outline-none py-2 text-white placeholder-gray-500"
      />
      {/* Популярные теги */}
      <div className="flex flex-wrap gap-2">
        {popularTags.map((tag) => (
          <button
            key={tag}
            onClick={() => togglePopularTag(tag)}
            className={`px-2 py-1 text-sm rounded-md transition-colors ${
              value.includes(tag)
                ? "bg-primary text-white"
                : "bg-[#1a1f2c] text-gray-300 hover:bg-[#2a3142]"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
