import { NotificationStatus } from "@se-2/common";

export interface Notification {
  id: string;
  user: `0x${string}`;
  title: string;
  message: string;
  href?: string;
  createdAt: string;
  status: NotificationStatus;
  itemId?: bigint;
}
