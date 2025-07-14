"use client";

import Spinner from "@/components//Spinner/Spinner";
import CustomerCard from "@/components/CustomerCard/CustomerCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchHires } from "~~/services/graphql/fetchers/job.service";
import { Job } from "~~/types/job.types";

type HiresData = {
  jobs: Job[];
};

export default function HiresListing({ userAddress }: { userAddress: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<HiresData>({
    queryKey: ["hiredFromUser", userAddress],
    queryFn: () => fetchHires(userAddress),
  });

  console.log("HiresListing data", data);

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["hiredFromUser", userAddress] });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to ensure UI updates
    await refetch();
  };

  return (
    <div className="w-full px-4 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-content-primary mb-2">My Hires</h1>
        <p className="text-content-secondary">Manage your hired jobs and projects</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center w-full h-64">
          <Spinner />
        </div>
      ) : (
        <div className="w-full">
          {data?.jobs && data.jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data?.jobs.map(job => <CustomerCard key={job.jobId} job={job} reload={reload} />)}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-content-secondary text-lg">No hires found.</p>
              <p className="text-content-tertiary mt-2">Start by hiring freelancers for your projects.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
