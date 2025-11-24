export enum NotificationStatus {
  UNREAD = 0,
  READ = 1,
  DONE = 2,
}
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
