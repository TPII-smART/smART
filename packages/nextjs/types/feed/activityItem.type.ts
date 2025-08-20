export interface ActivityItem {
  id: string;
  type: "application" | "message" | "status" | "payment" | "view" | "review";
  title: string;
  description: string;
  timestamp: string;
  status?: "pending" | "accepted" | "rejected" | "completed";
  client?: {
    name: string;
    avatar?: string;
  };
  amount?: number;
  isNew?: boolean;
}
