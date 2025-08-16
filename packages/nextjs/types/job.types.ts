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

  /** (Optional) Boolean indicating if the client has marked they received the job deliverables. */
  clientReceived?: boolean;

  /** (Optional) Boolean indicating if the freelancer has marked they delivered the job. */
  freelancerDelivered?: boolean;
}

export interface JobPosting {
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
}

/** Enum representing the possible states of a job. */
export enum JobStateEnum {
  WaitingForApproval = 0,
  Ongoing = 1,
  Finished = 2,
  Cancelled = 3,
  Disputed = 4,
}

export interface JobsData {
  jobs: Job[];
}

export interface JobPostingData {
  jobPostings: JobPosting[];
}
