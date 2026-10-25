"use client";

import { cn } from "@/lib/utils";

/** Reference-compatible password meter: 1 bar under 8 chars, 2 under 12, 3 above. */
export function PasswordStrengthMeter({ value }: { value: string }) {
  const strength = value.length === 0 ? 0 : value.length < 8 ? 1 : value.length < 12 ? 2 : 3;
  const filled = ["", "bg-[#d78a72]", "bg-[#e2c16b]", "bg-[#a7bf7e]"][strength];
  return (
    <div className="mt-[7px] mb-1 flex gap-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={cn(
            "h-[3px] flex-1 rounded-[10px] transition-[background] duration-[250ms]",
            index < strength ? filled : "bg-[#e8e9dd]",
          )}
        />
      ))}
    </div>
  );
}
