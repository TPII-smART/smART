"use client";

import { useEffect } from "react";
import ApplicationsListing from "@/components/ApplicationsListing";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export default function Applications() {
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["applicationsFromUser", userAddress],
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen mt-4">
      <ApplicationsListing userAddress={userAddress || ""} />
    </div>
  );
}
