import { Schemas } from "~~/services/graphql/config";
import { pollTransactionQuery } from "~~/services/graphql/fetchers/utils.service";

export async function waitTransaction<T>(
  schema: Schemas,
  transactionHash: `0x${string}` | undefined,
  fields?: (keyof T)[],
): Promise<T | null> {
  if (!transactionHash) {
    console.warn("No transaction hash provided");
    return null;
  }

  const poll = async () => {
    const baseSleep = 200;
    const maxSleep = 5000;

    let sleepTime = baseSleep;
    for (let i = 1; i <= 5; i++) {
      // Poll the transaction status with schema + "s" to use where clause
      const result = await pollTransactionQuery<T>(transactionHash, schema + "s", fields);
      if (result) {
        return result;
      }
      await new Promise(resolve => setTimeout(resolve, sleepTime));
      sleepTime = Math.min(baseSleep * 2 ** i, maxSleep);
    }

    console.error("No transaction found with hash:", transactionHash);
    return null;
  };

  try {
    return await poll();
  } catch (error) {
    console.error(`Error occurred while waiting for transaction, is the schema name '${schema}' ok??:`, error);
    return null;
  }
}
