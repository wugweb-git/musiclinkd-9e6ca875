import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** "a · b" from whichever parts are present, so an empty field leaves no stray separator. */
export function joinParts(...parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(" · ");
}
