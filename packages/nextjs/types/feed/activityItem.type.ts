export enum ActivityItemType {
  application = "application",
  message = "message",
  status = "status",
  payment = "payment",
  view = "view",
  review = "review",
  unknown = "unknown",
}

export enum ActivityItemStatus {
  pending = "pending",
  accepted = "accepted",
  cancelled = "cancelled",
  completed = "completed",
  waitingForReview = "waitingForReview",
  rejected = "rejected",
  disputed = "disputed",
  unknown = "",
}

export enum InteractionType {
  hiredTalent = "hiredTalent",
  gig = "gig",
  application = "application",
  unknown = "",
}

export interface ActivityItem {
  id: string;
  primaryKey: string;
  secondaryKey: string;
  type: ActivityItemType;
  interactionType: InteractionType;
  title?: string;
  description?: string;
  timestamp: string;
  status?: ActivityItemStatus;
  client?: string;
  freelancer?: string;
  amount?: number;
  isNew?: boolean;
  emitBy?: string;
}
