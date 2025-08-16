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
    const maxSleep = 10000;

    let sleepTime = baseSleep;
    for (let i = 1; i <= 10; i++) {
      const result = await pollTransactionQuery(transactionHash, schema);
      if (result) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, sleepTime));
      sleepTime = Math.min(baseSleep * 2 ** i, maxSleep);
    }
  };

  try {
    await poll();
  } catch (error) {
    console.error(`Error occurred while waiting for transaction, is the schema name '${schema}' ok??:`, error);
  }

  console.error("No transaction found with hash:", transactionHash);
  return false;
}
