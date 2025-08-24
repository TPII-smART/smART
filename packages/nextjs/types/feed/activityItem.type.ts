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
  job = "job",
  gig = "gig",
  unknown = "",
}

export interface ActivityItem {
  id: string;
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
