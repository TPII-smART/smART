"use client";

import Spinner from "@/components//Spinner/Spinner";
import JobCard from "@/components/Card/JobCard/JobCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJobsFromPosting } from "~~/services/graphql/fetchers/job/job.service";
import { JobsData } from "~~/types/job/job.types";

export default function MyJobsListing({ postingId }: { postingId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<JobsData>({
    queryKey: ["jobsFromJobPosting", postingId],
    queryFn: () => fetchJobsFromPosting(postingId),
  });

  console.log(data);

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["jobsFromJobPosting", postingId] });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to ensure UI updates
    await refetch();
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-content-primary mb-2">Jobs for Posting {postingId}</h1>
        <p className="text-content-secondary">Manage jobs for this posting</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center w-full h-64">
          <Spinner />
        </div>
      ) : (
        <div className="w-full">
          {data?.jobs && data.jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data?.jobs.map(job => <JobCard key={`${job.jobId}-${job.postingId}`} job={job} reload={reload} />)}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-content-secondary text-lg">No jobs found.</p>
              <p className="text-content-tertiary mt-2">Wait for clients to request jobs from your posting.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
