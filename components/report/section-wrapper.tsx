"use client";

import { useRef, useEffect, useState } from "react";

interface SectionWrapperProps {
  title: string;
  analysis?: string;
  variant?: "default" | "dark";
  children: React.ReactNode;
}

export function SectionWrapper({
  title,
  analysis,
  variant = "default",
  children,
}: SectionWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const bg =
    variant === "dark"
      ? "bg-bg-card-dark border-border-card"
      : "bg-bg-card border-border";

  return (
    <div
      ref={ref}
      className={`rounded-[--radius-card] border p-4 ${bg} transition-all duration-200 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <h3 className="font-semibold text-[14px] text-text mb-3">{title}</h3>
      <div className="mb-3">{children}</div>
      {analysis && (
        <div className="border-t border-border pt-3">
          <p className="text-text-secondary text-[14px] italic leading-relaxed">
            {analysis}
          </p>
        </div>
      )}
    </div>
  );
}
