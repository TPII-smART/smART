export enum GigDetailType {
  final = "final",
  partial = "partial",
}

export interface DetailData {
  type: "job" | "gig";
  title: string;
  description?: string;
  client?: string;
  freelancer?: string;
  category?: string;
  payment?: string;
  duration?: string;
  deadline?: number | string;
  state: number;
  freelancerDelivered: boolean;
  clientReceived: boolean;
  isRejected: boolean;
  createdAt?: string;
  acceptedAt?: string;
  canceledAt?: string;
  finishedAt?: string;
}
