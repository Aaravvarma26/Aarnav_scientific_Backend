import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
}

export function truncate(text: string, length: number) {
  if (!text) return "";
  return text.length > length ? text.slice(0, length).trim() + "…" : text;
}
