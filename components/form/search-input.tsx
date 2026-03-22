"use client";

import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function SearchInput({ value, onChange, onSubmit, disabled }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && value.trim()) onSubmit();
        }}
        placeholder="Введи команду..."
        disabled={disabled}
        className="w-full pl-10 pr-4 py-2.5 border border-border-secondary rounded-[--radius-button] bg-transparent text-text text-[14px] placeholder:text-muted shadow-[--shadow-light] outline-none focus:border-border-accent transition-colors disabled:opacity-50"
      />
    </div>
  );
}
