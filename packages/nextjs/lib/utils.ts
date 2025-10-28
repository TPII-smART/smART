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

export function formatDate(dateString: string | number | undefined): string {
  if (!dateString) return "N/A";

  const timestamp = typeof dateString === "string" ? parseInt(dateString) : dateString;

  const timestampMs = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;

  const date = new Date(timestampMs);

  if (isNaN(date.getTime())) return "N/A";

  const month = String(date.getMonth() + 1);
  const day = String(date.getUTCDate());
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, "0");

  return `${day}/${month}/${year} at ${hoursStr}:${minutes} ${ampm}`;
}

export function getTimeUntilDeadline(deadlineString: string | number | undefined): string {
  if (!deadlineString) return "N/A";

  const timestamp = typeof deadlineString === "string" ? parseInt(deadlineString) : deadlineString;

  const timestampMs = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;

  const deadline = new Date(timestampMs);

  if (isNaN(deadline.getTime())) return "N/A";

  const now = new Date();
  const msRemaining = deadline.getTime() - now.getTime();

  if (msRemaining < 0) {
    return "Deadline passed";
  }

  const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) {
    return days === 1 ? "1 day" : `${days} days`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m `;
  } else if (minutes > 0) {
    return minutes === 1 ? "1 minute" : `${minutes} minutes`;
  } else {
    return "Less than 1 minute";
  }
}

export function getDetailedTimeUntilDeadline(deadlineString: string | number | undefined) {
  if (!deadlineString) {
    return {
      isExpired: false,
      isValid: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "N/A",
    };
  }

  const timestamp = typeof deadlineString === "string" ? parseInt(deadlineString) : deadlineString;
  const timestampMs = timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
  const deadline = new Date(timestampMs);

  if (isNaN(deadline.getTime())) {
    return {
      isExpired: false,
      isValid: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "N/A",
    };
  }

  const now = new Date();
  const msRemaining = deadline.getTime() - now.getTime();

  if (msRemaining < 0) {
    return {
      isExpired: true,
      isValid: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "Deadline passed",
    };
  }

  const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((msRemaining % (1000 * 60)) / 1000);

  let formatted = "";
  if (days > 0) {
    formatted = days === 1 ? "1 day" : `${days} days`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    formatted = minutes === 1 ? "1 minute" : `${minutes} minutes`;
  } else {
    formatted = "Less than 1 minute";
  }

  return {
    isExpired: false,
    isValid: true,
    days,
    hours,
    minutes,
    seconds,
    formatted,
  };
}
