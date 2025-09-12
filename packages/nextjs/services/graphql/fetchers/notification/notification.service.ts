import { endpoint } from "../../config";
import { NotificationStatus } from "@se-2/common";
import request, { gql } from "graphql-request";
import { Notification } from "~~/types/notification.types";
import { Paginated, PaginationMetaArg, PaginationQueryResponse } from "~~/types/paginated.types";

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

export const fetchNotificationsByUserPaginated = async (
  meta: PaginationMetaArg,
  userAddress: string,
  statusList: NotificationStatus[] = [NotificationStatus.UNREAD, NotificationStatus.READ, NotificationStatus.DONE],
  search: string = "",
): Promise<Paginated<Notification>> => {
  const query = gql`
    query GetNotificationsByUser(
      $address: String!
      $limit: Int!
      $startCursor: String
      $endCursor: String
      $statusList: [Int!]
      $search: String
    ) {
      notifications(
        limit: $limit
        after: $endCursor
        before: $startCursor
        where: { user: $address, status_in: $statusList, OR: { message_contains: $search, title_contains: $search } }
        orderBy: "createdAt"
        orderDirection: "desc"
      ) {
        items {
          id
          user
          title
          message
          href
          createdAt
          status
          itemId
        }
        pageInfo {
          endCursor
          hasNextPage
          startCursor
          hasPreviousPage
        }
        totalCount
      }
    }
  `;

  const res = await request<{ notifications: PaginationQueryResponse<Notification> }>(endpoint, query, {
    address: userAddress,
    limit: meta.limit,
    startCursor: meta.startCursor,
    endCursor: meta.endCursor,
    statusList: statusList,
    search,
  });

  return {
    data: res.notifications.items ?? [],
    meta: {
      endCursor: res.notifications.pageInfo.endCursor,
      hasNextPage: res.notifications.pageInfo.hasNextPage,
      totalCount: res.notifications.totalCount,
      startCursor: res.notifications.pageInfo.startCursor,
      // hasPreviousPage: res.notifications.pageInfo.hasPreviousPage,
    },
  };
};
