export interface Job {
  /** Unique identifier for the job. */
  jobId: string;

  /** (Optional) Ethereum address of the freelancer assigned to the job, formatted as a hexadecimal string. */
  freelancer?: `0x${string}`;

  /** (Optional) Ethereum address of the client who created the job, formatted as a hexadecimal string. */
  client?: `0x${string}`;

  /** (Optional) Payment amount or details for the job. */
  payment?: string;

  /** (Optional) Title or short summary of the job. */
  title?: string;

  /** (Optional) Detailed description of the job requirements. */
  description?: string;

  /** (Optional) Category or field of the job. */
  category?: string;

  /** (Optional) Estimated time required to complete the job. */
  estimatedDuration?: string;

  /** (Optional) ISO date string representing when the job was created. */
  createdAt?: string;

  /** (Optional) ISO date string representing when the job was accepted by a freelancer. */
  acceptedAt?: string;

  /** (Optional) ISO date string representing the job's deadline. */
  deadline?: string;

  /** (Optional) ISO date string representing when the job was completed. */
  completedAt?: string;

  /** (Optional) ISO date string representing when the job was cancelled. */
  cancelledAt?: string;

  /** (Optional) Numeric rating given to the job, typically after completion. */
  rating?: number;
}

export interface JobsData {
  jobs: Job[];
}
