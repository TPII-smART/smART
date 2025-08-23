import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isImageUrl(url: string): boolean {
  try {
    const pathname = new URL(url, "http://dummy-base").pathname;
    return (
      url.startsWith("http") || url.startsWith("data:image") || /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/.test(pathname)
    );
  } catch {
    return false;
  }
}

export function addPrefixToUrl(url: string, prefix: string): string {
  if (!url.startsWith(prefix)) {
    return prefix + url;
  }
  return url;
}
