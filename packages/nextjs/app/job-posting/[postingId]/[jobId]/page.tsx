"use client";

import { useEffect } from "react";
import { useParams } from "next/dist/client/components/navigation";
import JobDetail from "@/components/JobDetail/JobDetail";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export default function JobPosting() {
  const { address: userAddress } = useAccount();
  const { postingId, jobId } = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["jobDetail", userAddress],
    });
  });

  return (
    <div className="flex flex-col mb-4 text-start p-4 ml-2 h-full overflow-auto">
      <h1 className="text-3xl font-bold tracking-tight text-content-primary">Job Details</h1>
      <p className="text-muted-foreground mt-2">View and manage your freelance job</p>
      <JobDetail postingId={String(postingId)} jobId={String(jobId)} />
    </div>
  );
}
