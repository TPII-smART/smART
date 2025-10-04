import { Gig } from "~~/types/gig";
import { Talent } from "~~/types/hiredTalent";

export interface WorkPostingFormProps {
  type: "hiredTalent" | "gig";
  refresh: (created: Talent | Gig) => void;
}

export class WorkPostingFormData {
  title: string;
  description: string;
  bannerImageFile: File | undefined;
  bannerImageHash: string | undefined;
  paymentInEth: string;
  estimatedDurationHours: string;
  category: string;

  constructor() {
    this.title = "";
    this.description = "";
    this.paymentInEth = "";
    this.estimatedDurationHours = "";
    this.category = "";
  }
}
