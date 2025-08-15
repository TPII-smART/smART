import { parseEther } from "viem";
import { WorkPostingFormData } from "~~/components/WorkPostingForm/types";
import { ZERO_ADDRESS } from "~~/utils/scaffold-eth/common";
import { ScaffoldWriteContractVariables } from "~~/utils/scaffold-eth/contract";

export class JobPosting {
  /** Unique identifier for the job posting. */
  postingId: string;

  /** Ethereum address of the freelancer who posted the job, formatted as a hexadecimal string. */
  freelancer: `0x${string}`;

  /** Base payment amount for the job posting. */
  basePayment: string;

  /** Title of the job posting. */
  title: string;

  /** Description of the job posting. */
  description: string;

  /** Category of the job posting. */
  category: string;

  /** Hash of the banner image associated with the job posting. */
  bannerImageHash: string;

  /** Minimum notice time required before starting the job, in seconds. */
  minimumNoticeTime: number;

  /** Average work duration expected for the job, in seconds. */
  averageWorkDuration: number;

  /** ISO date string representing when the job posting was created. */
  createdAt: string;

  /** (Optional) Numeric rating given to the job, typically after completion. */
  rating?: number;

  constructor() {
    this.postingId = "";
    this.freelancer = ZERO_ADDRESS;
    this.basePayment = "";
    this.title = "";
    this.description = "";
    this.category = "";
    this.bannerImageHash = "";
    this.minimumNoticeTime = 24;
    this.averageWorkDuration = 0;
    this.createdAt = "";
    this.rating = 0;
  }

  static mapFormDataToContractArgs(
    formData: WorkPostingFormData,
  ): ScaffoldWriteContractVariables<"JobsContract", "createJobPosting">["args"] {
    return [
      {
        title: formData.title,
        description: formData.description,
        bannerImageHash: formData.bannerImageHash || "",
        basePayment: parseEther(formData.paymentInEth),
        averageWorkDuration: BigInt(formData.estimatedDurationHours),
        minimumNoticeTime: BigInt(24),
        category: formData.category,
      },
    ];
  }
}

export interface JobPostingData {
  jobPostings: JobPosting[];
}
