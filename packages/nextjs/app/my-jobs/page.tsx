"use client";

import { useEffect } from "react";
import MyJobsListing from "@/components/MyJobsListing";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export default function MyJobs() {
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["jobsFromUser", userAddress],
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <MyJobsListing userAddress={userAddress || ""} />
    </div>
  );
}
