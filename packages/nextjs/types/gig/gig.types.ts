import { GigState } from "@se-2/common";
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

  /** Hash of the banner image associated with the gig. */
  gigBannerImageHash?: string;

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

  /**
   * (Optional) ISO date string representing when the job was delivered.
   */
  deliveredAt?: string;

  /**
   * (Optional) ISO date string representing when the job was
   * rejected by the client.
   */
  rejectedAt?: string;

  /** Ethereum address of the user who emitted the last update of the gig. */
  emitBy?: string;

  /** (Optional) Boolean indicating if the client has marked they received the gig deliverables. */
  clientReceived?: boolean;

  /** (Optional) Boolean indicating if the freelancer has marked they delivered the gig. */
  freelancerDelivered?: boolean;

  /** (Optional) Rating given by the client to the freelancer when the gig is completed. */
  rating?: number;

  /** (Optional) Unique identifier for the accepted application, if applicable. */
  acceptedApplicationId?: string;

  /** (Optional) Boolean indicating if the client has rejected the job. */
  clientRejected?: boolean;

  /** (Optional) Boolean indicating if the client has canceled the job. */
  clientCancelled?: boolean;

  /** (Optional) Boolean indicating if the freelancer has canceled the job. */
  freelancerCancelled?: boolean;

  /** (Optional) Hash or URL of the resource submitted for the job deliverable. */
  resource: string;

  /** (Optional) ISO date string representing when the deliverable was uploaded. */
  uploadedAt: string;

  /** (Optional) Comment provided by the freelancer upon submission. */
  submissionComment: string;

  /** (Optional) Comment provided by the client upon review. */
  clientResponse: string;

  /** (Optional) Boolean indicating if the submitted resource is a link. */
  isLink: boolean;

  constructor() {
    this.gigId = "";
    this.client = ZERO_ADDRESS;
    this.acceptedFreelancer = ZERO_ADDRESS;
    this.basePayment = "";
    this.finalPayment = "";
    this.title = "";
    this.description = "";
    this.category = "";
    this.gigBannerImageHash = "";
    this.maxDurationInHours = "";
    this.finalDurationInHours = "";
    this.deadline = "";
    this.state = GigState.Open;
    this.createdAt = "";
    this.acceptedAt = "";
    this.finishedAt = "";
    this.canceledAt = "";
    this.deliveredAt = "";
    this.rejectedAt = "";
    this.emitBy = ZERO_ADDRESS;
    this.rating = 0;
    this.clientRejected = false;
    this.clientCancelled = false;
    this.freelancerCancelled = false;
    this.resource = "";
    this.uploadedAt = "";
    this.submissionComment = "";
    this.clientResponse = "";
    this.isLink = false;
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

export interface GigsData {
  gigs: Gig[];
}
