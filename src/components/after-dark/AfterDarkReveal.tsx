"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type AfterDarkRevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
};

export function AfterDarkReveal({
  children,
  delay = 0,
  className = "",
}: AfterDarkRevealProps) {
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
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`ad-reveal ${visible ? "ad-reveal--visible" : ""} ${className}`}
      style={{ "--ad-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
