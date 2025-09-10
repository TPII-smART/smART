import { endpoint } from "../../config";
import request, { gql } from "graphql-request";
import { Notification } from "~~/types/notification.types";

export const fetchUnreadNotificationsAmountByUser = async (userAddress: string) => {
  const query = gql`
    query GetJobsPaginated($address: String!) {
      notifications(where: { user: $address, status: 0 }) {
        totalCount
      }
    }
  `;

  const res = await request<{ notifications: { totalCount: number } }>(endpoint, query, { address: userAddress });
  return res.notifications.totalCount;
};

export const fetchNotificationsByUser = async (userAddress: string) => {
  const query = gql`
    query GetNotificationsByUser($address: String!) {
      notifications(where: { user: $address }, orderBy: "createdAt", orderDirection: "desc") {
        items {
          id
          user
          title
          message
          href
          createdAt
          status
        }
      }
    }
  `;

  const res = await request<{ notifications: { items: Notification[] } }>(endpoint, query, { address: userAddress });
  return res.notifications.items;
};
