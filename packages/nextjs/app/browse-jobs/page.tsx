"use client";

import JobBrowser from "@/components/JobBrowser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJobPostings } from "~~/services/graphql/fetchers/job.service";
import { JobPostingData } from "~~/types/job.types";

export default function BrowseJobsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<JobPostingData>({
    queryKey: ["jobPostings"],
    queryFn: fetchJobPostings,
  });

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["jobPostings"] });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to ensure UI updates
    await refetch();
  };

  return (
    <div>
      <JobBrowser type="job" data={data as JobPostingData} isLoading={isLoading} reload={reload} />
    </div>
  );
}
