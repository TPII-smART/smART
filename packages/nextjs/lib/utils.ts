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

export function castHoursToDurationString(totalHours: number): string {
  if (totalHours < 1) {
    return "Less than an hour";
  }
  const years = Math.floor(totalHours / 8760);
  const months = Math.floor((totalHours % 8760) / 730);
  const weeks = Math.floor((totalHours % 730) / 168);
  const days = Math.floor((totalHours % 168) / 24);
  const hours = Math.floor(totalHours % 24);

  const parts = [];
  if (years > 0) parts.push(`${years} ${years > 1 ? "Years" : "Year"}`);
  if (months > 0) parts.push(`${months} ${months > 1 ? "Months" : "Month"}`);
  if (weeks > 0) parts.push(`${weeks} ${weeks > 1 ? "Weeks" : "Week"}`);
  if (days > 0) parts.push(`${days} ${days > 1 ? "Days" : "Day"}`);
  if (hours > 0) parts.push(`${hours} ${hours > 1 ? "Hours" : "Hour"}`);

  return parts.join(" ");
}

export function castDateToTimestamp(date: string | undefined): string {
  if (!date) return "N/A";
  const timestamp = Number(date) * 1000;
  const now = Date.now();
  const diffMs = now - timestamp;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffHour < 24) {
    if (diffHour < 1) {
      if (diffMin < 1) {
        return "0 minutes ago";
      }
      return `${diffMin} minutes ago`;
    }
    return `${diffHour} hours ago`;
  } else if (diffDay < 7) {
    return `${diffDay} days ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
}

export function castDateToTimestampNum(date: string | undefined): number {
  if (!date) return 0;
  const timestamp = Number(date) * 1000;
  return isNaN(timestamp) ? 0 : timestamp;
}
