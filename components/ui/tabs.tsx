"use client";

import { createContext, useContext, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
  variant: "default" | "cozy";
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({
  defaultValue,
  value: controlled,
  onValueChange,
  variant = "cozy",
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: "default" | "cozy";
  children: ReactNode;
  className?: string;
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue ?? "");
  const baseId = useId();
  const value = controlled ?? uncontrolled;
  const setValue = (next: string) => {
    if (controlled === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };
  return (
    <TabsContext.Provider value={{ value, setValue, baseId, variant }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  const context = useContext(TabsContext);
  const cozy = context?.variant === "cozy";
  return (
    <div
      role="tablist"
        className={cn(
          "inline-flex flex-wrap items-center gap-1 rounded-full border border-[#eae5d9] bg-[#fffdf8] p-1.5 cozy-shadow",
          !cozy &&
            "rounded-md border border-border-soft bg-cream-100 p-1 shadow-none",
          className,
        )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");
  const active = context.value === value;
  const cozy = context.variant === "cozy";
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={`${context.baseId}-${value}`}
      id={`${context.baseId}-tab-${value}`}
      tabIndex={active ? 0 : -1}
      onClick={() => context.setValue(value)}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-sm px-3.5 text-[13px] font-bold text-bark-700 transition hover:text-bark-900",
        active && "bg-white text-sage-700 shadow-soft",
        cozy && "rounded-full px-4 text-xs font-extrabold active:translate-y-[2px] motion-reduce:active:translate-y-0",
        cozy && active && "bg-sage-700 text-white shadow-[0_3px_0_#45674f] hover:text-white",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: ReactNode;
  className?: string;
}) {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsContent must be used within Tabs");
  if (context.value !== value) return null;
  return (
    <div
      role="tabpanel"
      id={`${context.baseId}-${value}`}
      aria-labelledby={`${context.baseId}-tab-${value}`}
      className={className}
    >
      {children}
    </div>
  );
}
