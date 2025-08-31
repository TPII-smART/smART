"use client";

import Spinner from "@/components//Spinner/Spinner";
import { JobPostingCard } from "@/components/Card/JobPostingCard/JobPostingCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { fetchMyJobPostings } from "~~/services/graphql/fetchers/job/job.service";
import { JobPostingData } from "~~/types/job/job.types";

export default function MyJobPostingListing({ userAddress }: { userAddress: string }) {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<JobPostingData>({
    queryKey: ["jobPostingsFromUser", userAddress],
    queryFn: () => fetchMyJobPostings(userAddress),
  });

  console.log(data);

  const isOwner = userAddress === address;

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["jobPostingsFromUser", userAddress] });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to ensure UI updates
    await refetch();
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8">
      {isLoading ? (
        <div className="flex items-center justify-center w-full h-64">
          <Spinner />
        </div>
      ) : (
        <div className="w-full">
          {data?.jobPostings && data.jobPostings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data?.jobPostings.map(jobPosting => (
                <JobPostingCard key={jobPosting.postingId} jobPosting={jobPosting} reload={reload} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-content-secondary text-lg">No job postings found.</p>
              <p className="text-content-tertiary mt-2">
                {isOwner ? (
                  <span>
                    Go to the Job Posting section on the{" "}
                    <a href={`/browse`} className="underline">
                      Browse
                    </a>{" "}
                    page to create your first job posting.
                  </span>
                ) : (
                  <span>This user has not posted any jobs yet.</span>
                )}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
