export * from "./job-posting.types";

export interface Job {
  /** Unique identifier for the job. */
  jobId: string;

  /** Unique identifier for the job posting this job is based on. */
  postingId: string;

  /** (Optional) Ethereum address of the client who created the job, formatted as a hexadecimal string. */
  client?: `0x${string}`;

  /** (Optional) Ethereum address of the freelancer assigned to the job, formatted as a hexadecimal string. */
  freelancer?: `0x${string}`;

  /** (Optional) Payment amount or details for the job. */
  payment?: string;

  /** (Optional) Title or short summary of the job. */
  title?: string;

  /** (Optional) Detailed description of the job requirements. */
  description?: string;

  /** (Optional) Category or field of the job. */
  category?: string;

  /** (Optional) Hash of the banner image associated with the job. */
  bannerImageHash?: string;

  /** (Optional) Estimated time required to complete the job. */
  jobDuration?: string;

  /** (Optional) ISO date string representing the job's deadline. */
  deadline?: string | number;

  /** Current state of the job, represented as an integer. */
  state: number;

  /** (Optional) ISO date string representing when the job was created. */
  createdAt?: string;

  /** (Optional) ISO date string representing when the job was accepted by a freelancer. */
  acceptedAt?: string;

  /**
   * (Optional) ISO date string representing when the job was finished.
   */
  finishedAt?: string;

  /**
   * (Optional) ISO date string representing when the job was canceled.
   */
  canceledAt?: string;

  /**
   * (Optional) ISO date string representing when the job was delivered.
   */
  deliveredAt?: string;

  /** (Optional) Boolean indicating if the client has marked they received the job deliverables. */
  clientReceived?: boolean;

  /** (Optional) Boolean indicating if the freelancer has marked they delivered the job. */
  freelancerDelivered?: boolean;

  /** (Optional) Ethereum address of the user who emitted the job event, formatted as a hexadecimal string. */
  emitBy?: `0x${string}`;
}

export interface JobsData {
  jobs: Job[];
}
