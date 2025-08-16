import { endpoint } from "../config";
import request, { gql } from "graphql-request";

export async function pollTransactionQuery(transactionHash: string, schema: string): Promise<boolean> {
  const query = gql`
    query PollTransaction ($transactionHash: String!) {
      ${schema}(where: { lastTransactionHash: $transactionHash }) {
        items {
          lastTransactionHash
        }
      }
    }
  `;

  const res = await request<{ [key: string]: { items: { lastTransactionHash: string }[] } }>(endpoint, query, {
    transactionHash,
  });

  return res?.[schema]?.items?.[0]?.lastTransactionHash === transactionHash;
}
