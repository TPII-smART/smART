import { JobPosting } from "~~/types/job.types";

export interface JobPostingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  jobPosting?: JobPosting;
  reload?: () => Promise<void>;
}
