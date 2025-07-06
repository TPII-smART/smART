"use client";

import Spinner from "@/components//Spinner/Spinner";
import CustomerCard from "@/components/CustomerCard/CustomerCard";
import { useQuery } from "@tanstack/react-query";
import { fetchHires } from "~~/services/graphql/fetchers/job.service";
import { Job } from "~~/types/job.types";

type HiresData = {
  jobs: Job[];
};

export default function HiresListing({ userAddress }: { userAddress: string }) {
  const { data, isLoading } = useQuery<HiresData>({
    queryKey: ["hiredFromUser", userAddress],
    queryFn: () => fetchHires(userAddress),
  });

  console.log("HiresListing data", data);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-2xl font-bold mb-4 text-black">My Hires</h1>
      {isLoading ? (
        <div className="flex items-center justify-center w-full h-64">
          <Spinner />
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          {data?.jobs && data.jobs.length > 0 ? (
            <ul className="space-y-4">
              {data?.jobs.map(job => <CustomerCard key={job.jobId} address={job.freelancer || ""} job={job} />)}
            </ul>
          ) : (
            <p className="text-gray-600">No jobs found.</p>
          )}
        </div>
      )}
    </div>
  );
}
