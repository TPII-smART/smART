import { AnalysisBadge } from "~~/types/deliverable";

export interface DeliverableVerificationProps {
  workId: string;
  deliverables: string[];
  workTitle: string;
  workDescription: string;
}

export interface VerificationChipProps {
  badge: AnalysisBadge;
  details: string;
}
