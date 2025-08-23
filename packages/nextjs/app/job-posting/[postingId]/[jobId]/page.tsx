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
    <div className="flex flex-col min-h-screen mt-4">
      <JobDetail postingId={String(postingId)} jobId={String(jobId)} />
    </div>
  );
}
