import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function shortAlias(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "Anggota";
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}
