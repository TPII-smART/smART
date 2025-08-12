"use client";

import { useEffect } from "react";
import MyJobPostingsListing from "@/components/MyJobPostingsListing";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export default function MyJobs() {
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["jobPostingsFromUser", userAddress],
    });
  });

  return (
    <div className="flex flex-col min-h-screen mt-4">
      <MyJobPostingsListing userAddress={userAddress || ""} />
    </div>
  );
}
