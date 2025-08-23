import { Gig } from "~~/types/gig";
import { JobPosting } from "~~/types/job";

export interface WorkPostingFormProps {
  type: "job" | "gig";
  refresh: (created: JobPosting | Gig) => void;
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
