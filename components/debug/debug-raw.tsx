"use client";

import { useState } from "react";

interface DebugRawProps {
  label: string;
  data: unknown;
}

/** Временный debug-компонент. Удалить после отладки. */
export function DebugRaw({ label, data }: DebugRawProps) {
  const [open, setOpen] = useState(false);

  const text =
    typeof data === "string" ? data : JSON.stringify(data, null, 2);

  return (
    <div className="border border-yellow-600/40 rounded bg-yellow-900/20 text-xs my-2">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left px-3 py-2 text-yellow-300 font-mono"
      >
        {open ? "▼" : "▶"} {label}
      </button>
      {open && (
        <pre className="px-3 pb-3 text-green-300/80 whitespace-pre-wrap break-all max-h-60 overflow-y-auto">
          {text}
        </pre>
      )}
    </div>
  );
}
