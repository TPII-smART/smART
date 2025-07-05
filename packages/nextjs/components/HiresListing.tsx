"use client";

import CustomerCard from "@/components/ui/CustomerCard";
import { useQuery } from "@tanstack/react-query";
import { gql, request } from "graphql-request";

type Job = {
  jobId: string;
  freelancer?: `0x${string}`;
  client?: `0x${string}`;
  payment?: string;
  title?: string;
  description?: string;
  category?: string;
  estimatedDuration?: string;
  createdAt?: string;
  acceptedAt?: string;
  deadline?: string;
  completedAt?: string;
  cancelledAt?: string;
};

type HiresData = {
  jobs: Job[];
};

const fetchHires = async (userAddress: string) => {
  console.log("fetchHires", userAddress);

  const query = gql`
    query GetJobs($client: String!) {
      jobs(where: { client: $client }, orderBy: "acceptedAt", orderDirection: "desc") {
        items {
          jobId
          freelancer
          client
          payment
          title
          description
          category
          estimatedDuration
          createdAt
          acceptedAt
          deadline
          completedAt
          cancelledAt
        }
      }
    }
  `;
  const endpoint = process.env.NEXT_PUBLIC_PONDER_URL || "http://localhost:42069";
  const res = await request<{ jobs: { items: Job[] } }>(endpoint, query, { client: userAddress });
  return { jobs: res.jobs.items };
};

export default function HiresListing({ userAddress }: { userAddress: string }) {
  const { data } = useQuery<HiresData>({
    queryKey: ["hiredFromUser", userAddress],
    queryFn: () => fetchHires(userAddress),
  });

  console.log("HiresListing data", data);

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
