export enum GigDetailType {
  final = "final",
  partial = "partial",
}

export interface DetailData {
  type: "job" | "gig";
  title: string;
  description?: string;
  proposalComment?: string;
  client?: string;
  freelancer?: string;
  category?: string;
  payment?: string;
  duration?: string;
  deadline?: number | string;
  state: number;
  rating?: number;
  freelancerDelivered: boolean;
  clientReceived: boolean;
  clientRejected: boolean;
  isRejected: boolean;
  createdAt?: string;
  acceptedAt?: string;
  canceledAt?: string;
  finishedAt?: string;
}
