import React, { useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (v: string) => void;
  length?: number;
}

export const OtpInput: React.FC<OtpInputProps> = ({ value, onChange, length = 6 }) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const setDigit = (i: number, d: string) => {
    const clean = d.replace(/\D/g, "").slice(-1);
    const next = digits.slice();
    next[i] = clean;
    onChange(next.join("").trimEnd());
    if (clean && i < length - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (pasted) {
      e.preventDefault();
      onChange(pasted);
      refs.current[Math.min(pasted.length, length - 1)]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2.5">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          inputMode="numeric"
          maxLength={1}
          className="h-13 w-11 sm:h-14 sm:w-12 rounded-[13px] border border-[#E8E5EC] bg-white text-center text-xl font-medium text-[#111111] transition-all duration-200 focus:border-[#6D28D9] focus:outline-none focus:ring-4 focus:ring-[#F3EEFF]"
        />
      ))}
    </div>
  );
};