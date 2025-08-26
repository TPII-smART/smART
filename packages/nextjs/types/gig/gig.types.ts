import { parseEther } from "viem";
import { WorkPostingFormData } from "~~/components/WorkPostingForm/types";
import { ZERO_ADDRESS } from "~~/utils/scaffold-eth/common";
import { ScaffoldWriteContractVariables } from "~~/utils/scaffold-eth/contract";

export * from "./gig-application.types";

export class Gig {
  /** Unique identifier for the gig. */
  gigId: string;

  /** Ethereum address of the client who created the gig, formatted as a hexadecimal string. */
  client: `0x${string}`;

  /** (Optional) Ethereum address of the freelancer assigned to the gig, formatted as a hexadecimal string. */
  acceptedFreelancer?: `0x${string}`;

  /** (Optional) Max payment amount or details for the gig. */
  basePayment?: string;

  /** (Optional) Final payment amount or details for the gig. */
  finalPayment?: string;

  /** Title or short summary of the gig. */
  title?: string;

  /** Detailed description of the gig requirements. */
  description?: string;

  /** Category or field of the gig. */
  category?: string;

  /** (Optional) Max time to complete the gig. */
  maxDurationInHours?: string;

  /** (Optional) Final time to complete the gig. */
  finalDurationInHours?: string;

  /** (Optional) ISO date string representing the gig's deadline. */
  deadline?: string | number;

  /** Current state of the gig, represented as an integer. */
  state: number;

  /** (Optional) ISO date string representing when the gig was created. */
  createdAt?: string;

  /** (Optional) ISO date string representing when the gig was accepted by a freelancer. */
  acceptedAt?: string;

  /**
   * (Optional) ISO date string representing when the gig was finished.
   */
  finishedAt?: string;

  /**
   * (Optional) ISO date string representing when the gig was canceled.
   */
  canceledAt?: string;

  /** (Optional) Boolean indicating if the client has marked they received the gig deliverables. */
  clientReceived?: boolean;

  /** (Optional) Boolean indicating if the freelancer has marked they delivered the gig. */
  freelancerDelivered?: boolean;

  /** (Optional) Rating given by the client to the freelancer when the gig is completed. */
  rating?: number;

  /** (Optional) Unique identifier for the accepted application, if applicable. */
  acceptedApplicationId?: string;

  constructor() {
    this.gigId = "";
    this.client = ZERO_ADDRESS;
    this.acceptedFreelancer = ZERO_ADDRESS;
    this.basePayment = "";
    this.finalPayment = "";
    this.title = "";
    this.description = "";
    this.category = "";
    this.maxDurationInHours = "";
    this.finalDurationInHours = "";
    this.deadline = "";
    this.state = GigStateEnum.Open;
    this.createdAt = "";
    this.acceptedAt = "";
    this.finishedAt = "";
    this.canceledAt = "";
    this.clientReceived = false;
    this.freelancerDelivered = false;
    this.acceptedApplicationId = "";
  }

  static mapFormDataToContractArgs(
    formData: WorkPostingFormData,
  ): ScaffoldWriteContractVariables<"GigsContract", "createGig">["args"] {
    return [
      {
        title: formData.title,
        description: formData.description,
        gigBannerImageHash: formData.bannerImageHash || "",
        basePayment: parseEther(formData.paymentInEth),
        maxDurationInHours: BigInt(formData.estimatedDurationHours),
        category: formData.category,
      },
    ];
  }
}

/** Enum representing the possible states of a gig. */
export enum GigStateEnum {
  Open = 0,
  InProgress = 1,
  Completed = 2,
  Cancelled = 3,
  Disputed = 4,
}

export interface GigsData {
  gigs: Gig[];
}
