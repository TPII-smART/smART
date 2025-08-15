import { JobPosting } from "~~/types/job";

export interface JobPostingCardProps extends React.HTMLAttributes<HTMLDivElement> {
  jobPosting?: JobPosting;
  reload?: () => Promise<void>;
}
