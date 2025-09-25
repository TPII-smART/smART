"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components//Spinner/Spinner";
import { JobPostingCard } from "@/components/Card/JobPostingCard/JobPostingCard";
import { useAccount } from "wagmi";
import { usePagination } from "~~/hooks/use-pagination";
import { fetchMyJobPostingsPaginated } from "~~/services/graphql/fetchers/job/job.service";
import { JobPosting } from "~~/types/job/job.types";

export default function MyJobPostingListing({ userAddress }: { userAddress: string }) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);

  const { handleScroll, fetchPaginatedData } = usePagination({
    fetchFunction: fetchMyJobPostingsPaginated,
    loadingFunction: setLoading,
    setDataFunction: setJobPostings,
  });

  const isOwner = userAddress === address;

  useEffect(() => {
    if (!userAddress) return;

    fetchPaginatedData(true, "jobPostings", userAddress);
  }, [userAddress, fetchPaginatedData]);

  return (
    <div
      className="w-full px-4 md:px-6 lg:px-8 mt-6 mb-6 overflow-auto max-h-[inherit]"
      onScroll={e => handleScroll(e, "jobPostings", userAddress)}
    >
      <div className="w-full">
        {jobPostings && jobPostings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {jobPostings.map(jobPosting => (
                <JobPostingCard key={jobPosting.postingId} jobPosting={jobPosting} />
              ))}
            </div>
            {loading && (
              <div className="flex items-center justify-center w-full h-64">
                <Spinner />
              </div>
            )}
            <div className="h-6" />
          </>
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
    </div>
  );
}
