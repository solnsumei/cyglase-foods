"use client";

import { useRef, useEffect } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  name?: string;
}

export default function OtpInput({
  value = "",
  onChange,
  disabled = false,
  autoFocus = true,
  name = "token",
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Split value into array of 6 characters
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || "");

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus]);

  const handleDigitChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Extract only digits
    const cleanDigits = rawVal.replace(/\D/g, "");

    if (!cleanDigits) {
      // Clear current digit
      const nextDigits = [...digits];
      nextDigits[index] = "";
      onChange(nextDigits.join(""));
      return;
    }

    if (cleanDigits.length > 1) {
      // User pasted or typed multiple digits into one box
      handlePastedCode(cleanDigits);
      return;
    }

    const nextDigits = [...digits];
    nextDigits[index] = cleanDigits[0];
    const newOtp = nextDigits.join("");
    onChange(newOtp);

    // Auto-advance focus to next slot
    if (index < 5 && cleanDigits[0]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // If current slot is empty, backspace moves to and clears previous slot
        inputRefs.current[index - 1]?.focus();
        const nextDigits = [...digits];
        nextDigits[index - 1] = "";
        onChange(nextDigits.join(""));
      } else {
        const nextDigits = [...digits];
        nextDigits[index] = "";
        onChange(nextDigits.join(""));
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePastedCode = (pastedText: string) => {
    const cleanCode = pastedText.replace(/\D/g, "").slice(0, 6);
    if (!cleanCode) return;

    onChange(cleanCode);
    const focusTarget = Math.min(cleanCode.length, 5);
    inputRefs.current[focusTarget]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    handlePastedCode(pasted);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Hidden input so form submission by name='token' works transparently */}
      <input type="hidden" name={name} value={value} />

      <div className="flex items-center justify-center gap-1.5 sm:gap-2.5">
        {digits.map((digit, index) => {
          const isFilled = digit !== "";
          return (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              disabled={disabled}
              onChange={(e) => handleDigitChange(index, e)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className={`w-11 h-14 sm:w-12 sm:h-16 text-center font-mono font-black text-xl sm:text-2xl rounded-2xl border-2 transition-all shadow-xs outline-none select-none ${
                isFilled
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-base-300 bg-base-100 text-base-content focus:border-primary focus:bg-base-100"
              }`}
            />
          );
        })}
      </div>
      <p className="text-[11px] text-base-content/50 mt-1">
        Type or paste the 6-digit code sent to your inbox
      </p>
    </div>
  );
}
