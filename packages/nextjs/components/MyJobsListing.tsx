"use client";

import { useQuery } from "@tanstack/react-query";
import CustomerCard from "~~/components/CustomerCard/CustomerCard";
import { fetchMyJobs } from "~~/services/graphql/fetchers/job.service";
import { JobsData } from "~~/types/job.types";

export default function MyJobsListing({ userAddress }: { userAddress: string }) {
  const { data } = useQuery<JobsData>({
    queryKey: ["jobsFromUser", userAddress],
    queryFn: () => fetchMyJobs(userAddress),
  });

  console.log(data);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">My Jobs</h1>
      <div className="w-full max-w-2xl">
        {data?.jobs && data.jobs.length > 0 ? (
          <ul className="space-y-4">
            {data?.jobs.map(job => (
              <CustomerCard
                key={job.jobId}
                address={job.freelancer || ""}
                jobStatus={
                  job.completedAt ? "finished" : job.cancelledAt ? "cancelled" : job.acceptedAt ? "ongoing" : "ongoing"
                }
                tags={[job.category || "General"]}
              />
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No jobs found.</p>
        )}
      </div>
    </div>
  );
}
