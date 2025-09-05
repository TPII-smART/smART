import { endpoint } from "../../config";
import request, { gql } from "graphql-request";

export const fetchUnreadNotificationsAmountByUser = async (userAddress: string) => {
  const query = gql`
    query GetJobsPaginated($address: String!) {
      notifications(where: { user: $address, read: false }) {
        totalCount
      }
    }
  `;

  const res = await request<{ notifications: { totalCount: number } }>(endpoint, query, { address: userAddress });
  return res.notifications.totalCount;
};
