interface TitleInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function TitleInput({ value, onChange }: TitleInputProps) {
  return (
    <input
      type="text"
      placeholder="Enter your post title"
      value={value}
      onChange={onChange}
      className="w-full text-3xl font-bold bg-transparent border-b-2 border-[#2a3142] focus:border-[#6959a0] focus:outline-none py-2 text-white placeholder-gray-500"
    />
  );
}
