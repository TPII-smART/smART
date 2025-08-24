import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Schemas } from "~~/services/graphql/config";
import { pollTransactionQuery } from "~~/services/graphql/fetchers/utils.service";

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

export async function waitTransaction(schema: Schemas, transactionHash: `0x${string}` | undefined) {
  if (!transactionHash) {
    console.warn("No transaction hash provided");
    return false;
  }

  const poll = async () => {
    const baseSleep = 200;
    const maxSleep = 5000;

    let sleepTime = baseSleep;
    for (let i = 1; i <= 5; i++) {
      // Poll the transaction status with schema + "s" to use where clause
      const result = await pollTransactionQuery(transactionHash, schema + "s");
      if (result) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, sleepTime));
      sleepTime = Math.min(baseSleep * 2 ** i, maxSleep);
    }

    console.error("No transaction found with hash:", transactionHash);
    return false;
  };

  try {
    return await poll();
  } catch (error) {
    console.error(`Error occurred while waiting for transaction, is the schema name '${schema}' ok??:`, error);
    return false;
  }
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
