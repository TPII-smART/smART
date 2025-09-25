import { Job } from "~~/types/job/job.types";

export type JobCardProps = React.HTMLAttributes<HTMLDivElement> & {
  /**
   * The job details.
   * This includes information such as job ID,
   * freelancer, client, payment, title, description,
   * category, estimated duration, and various
   * timestamps related to the job's lifecycle.
   */
  job: Job;
  /**
   * If true, highlights the card (e.g., for emphasis).
   */
  highlight?: boolean;
};
