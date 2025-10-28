export * from "./talent.types";

export interface HiredTalent {
  /** Unique identifier for the hiredTalent. */
  hiredTalentId: string;

  /** Unique identifier for the talent this hiredTalent is based on. */
  talentId: string;

  /** (Optional) Ethereum address of the client who created the hiredTalent, formatted as a hexadecimal string. */
  client?: `0x${string}`;

  /** (Optional) Ethereum address of the freelancer assigned to the hiredTalent, formatted as a hexadecimal string. */
  freelancer?: `0x${string}`;

  /** (Optional) Payment amount or details for the hiredTalent. */
  payment?: string;

  /** (Optional) Title or short summary of the hiredTalent. */
  title?: string;

  /** (Optional) Detailed description of the hiredTalent requirements. */
  description?: string;

  /** (Optional) Category or field of the hiredTalent. */
  category?: string;

  /** (Optional) Hash of the banner image associated with the hiredTalent. */
  bannerImageHash?: string;

  /** (Optional) Estimated time required to complete the hiredTalent. */
  hiredTalentDuration?: string;

  /** (Optional) ISO date string representing the hiredTalent's deadline. */
  deadline?: string | number;

  /** Current state of the hiredTalent, represented as an integer. */
  state: number;

  /** (Optional) ISO date string representing when the hiredTalent was created. */
  createdAt?: string;

  /** (Optional) ISO date string representing when the hiredTalent was accepted by a freelancer. */
  acceptedAt?: string;

  /**
   * (Optional) ISO date string representing when the hiredTalent was finished.
   */
  finishedAt?: string;

  /**
   * (Optional) ISO date string representing when the hiredTalent was canceled.
   */
  canceledAt?: string;

  /**
   * (Optional) ISO date string representing when the hiredTalent was delivered.
   */
  deliveredAt?: string;

  /**
   * (Optional) Number between 1 and 5 representing the hiredTalent rating.
   */
  rating?: number;

  /** (Optional) Boolean indicating if the client has marked they received the hiredTalent deliverables. */
  clientReceived?: boolean;

  /** (Optional) Boolean indicating if the freelancer has marked they delivered the hiredTalent. */
  freelancerDelivered?: boolean;

  /** (Optional) Boolean indicating if the client has rejected the hiredTalent. */
  clientRejected?: boolean;

  /** (Optional) Boolean indicating if the client has canceled the hiredTalent. */
  clientCancelled?: boolean;

  /** (Optional) Boolean indicating if the freelancer has canceled the hiredTalent. */
  freelancerCancelled?: boolean;

  /** (Optional) Boolean indicating if the freelancer has uploaded a deliverable. */
  freelancerUploaded?: boolean;

  /** (Optional) Ethereum address of the user who emitted the hiredTalent event, formatted as a hexadecimal string. */
  emitBy?: `0x${string}`;
}

export interface HiredTalentsData {
  hiredTalents: HiredTalent[];
}
