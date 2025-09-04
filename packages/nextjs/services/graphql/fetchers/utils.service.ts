import { endpoint } from "../config";
import request, { gql } from "graphql-request";

export async function pollTransactionQuery<T>(
  transactionHash: string,
  schema: string,
  schemaKeys?: (keyof T)[],
): Promise<T> {
  const query = gql`
    query PollTransaction ($transactionHash: String!) {
      ${schema}(where: { lastTransactionHash: $transactionHash }) {
        items {
          lastTransactionHash
          ${schemaKeys?.join("\n") || ""}
        }
      }
    }
  `;

  const res = await request<{ [key: string]: { items: T[] } }>(endpoint, query, {
    transactionHash,
  });

  return res?.[schema]?.items?.[0];
}
