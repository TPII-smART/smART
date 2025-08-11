"use client";

import { useEffect } from "react";
import MyGigsListing from "@/components/MyGigsListing";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export default function MyGigs() {
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["gigsFromUser", userAddress],
    });
  });

  return (
    <div className="flex flex-col min-h-screen mt-4">
      <MyGigsListing userAddress={userAddress || ""} />
    </div>
  );
}
