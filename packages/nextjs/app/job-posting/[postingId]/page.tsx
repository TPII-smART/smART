"use client";

import { useEffect } from "react";
import { useParams } from "next/dist/client/components/navigation";
import MyJobsListing from "@/components/MyJobsListing";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export default function JobPosting() {
  const { address: userAddress } = useAccount();
  const { postingId } = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["jobPostingsFromUser", userAddress],
    });
  });

  return (
    <div className="w-full h-full overflow-auto flex flex-col">
      <MyJobsListing postingId={String(postingId ?? "")} />
    </div>
  );
}
