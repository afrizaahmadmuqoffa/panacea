"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("divide-y divide-cream-200", className)}>{children}</div>;
}

export function AccordionItem({ question, children }: { question: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 py-5 text-left font-heading text-base font-extrabold text-bark-900 transition hover:text-sage-700"
      >
        <span>{question}</span>
        <span
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full bg-cream-100 transition",
            open && "rotate-180 bg-sage-100",
          )}
        >
          <ChevronDown className="size-4" aria-hidden="true" />
        </span>
      </button>
      {open ? (
        <div className="pb-5 pr-12 text-sm leading-relaxed text-bark-700">{children}</div>
      ) : null}
    </div>
  );
}
