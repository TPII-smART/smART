import { Job } from "~~/types/job.types";

export type CustomerProps = {
  /**
   * The address of the customer.
   */
  address: string;
  /**
   * The job details.
   * This includes information such as job ID,
   * freelancer, client, payment, title, description,
   * category, estimated duration, and various
   * timestamps related to the job's lifecycle.
   */
  job: Job;
};
