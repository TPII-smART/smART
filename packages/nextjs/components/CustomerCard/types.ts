import { Job } from "~~/types/job.types";

export type CustomerProps = {
  /**
   * The job details.
   * This includes information such as job ID,
   * freelancer, client, payment, title, description,
   * category, estimated duration, and various
   * timestamps related to the job's lifecycle.
   */
  job: Job;
  /**
   * A function to reload the job data.
   */
  reload?: () => Promise<void>;
};
