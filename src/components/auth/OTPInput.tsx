"use client";

import { useRef, useState, useEffect } from "react";

type OTPInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

import { AUTH_OTP_LENGTH } from "@/lib/auth/otp";

export function OTPInput({
  length = AUTH_OTP_LENGTH,
  value,
  onChange,
  disabled,
}: OTPInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  function updateDigit(index: number, char: string) {
    const clean = char.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, i) => (i === index ? clean : d.trim())).join("");
    onChange(next.replace(/\s/g, ""));

    if (clean && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index]?.trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, length - 1);
    inputsRef.current[focusIndex]?.focus();
  }

  return (
    <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputsRef.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digits[i]?.trim() ?? ""}
          onChange={(e) => updateDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          aria-label={`Digit ${i + 1}`}
          className="h-12 w-10 rounded-lg border border-kay-border bg-kay-input-bg text-center text-[18px] font-medium text-kay-fg outline-none transition-colors focus:border-kay-fg disabled:opacity-50 sm:h-14 sm:w-11"
        />
      ))}
    </div>
  );
}
