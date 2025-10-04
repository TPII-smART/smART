import { parseEther } from "viem";
import { WorkPostingFormData } from "~~/components/WorkPostingForm/types";
import { ZERO_ADDRESS } from "~~/utils/scaffold-eth/common";
import { ScaffoldWriteContractVariables } from "~~/utils/scaffold-eth/contract";

export class Talent {
  /** Unique identifier for the talent. */
  talentId: string;

  /** Ethereum address of the freelancer who posted the hiredTalent, formatted as a hexadecimal string. */
  freelancer: `0x${string}`;

  /** Base payment amount for the talent. */
  basePayment: string;

  /** Title of the talent. */
  title: string;

  /** Description of the talent. */
  description: string;

  /** Category of the talent. */
  category: string;

  /** Hash of the banner image associated with the talent. */
  bannerImageHash: string;

  /** Minimum notice time required before starting the hiredTalent, in seconds. */
  minimumNoticeTime: number;

  /** Average work duration expected for the hiredTalent, in seconds. */
  averageWorkDuration: number;

  /** ISO date string representing when the talent was created. */
  createdAt: string;

  /** (Optional) Numeric rating given to the hiredTalent, typically after completion. */
  rating?: number;

  constructor() {
    this.talentId = "";
    this.freelancer = ZERO_ADDRESS;
    this.basePayment = "";
    this.title = "";
    this.description = "";
    this.category = "";
    this.bannerImageHash = "";
    this.minimumNoticeTime = 24;
    this.averageWorkDuration = 0;
    this.createdAt = "";
    // this.rating = 0;
  }

  static mapFormDataToContractArgs(
    formData: WorkPostingFormData,
  ): ScaffoldWriteContractVariables<"HiredTalentsContract", "createTalent">["args"] {
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

export interface TalentData {
  talents: Talent[];
}
