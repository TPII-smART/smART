"use client";

import { useEffect } from "react";
import HiresListing from "@/components/HiresListing";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";

export default function Hires() {
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["hiredFromUser", userAddress],
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <HiresListing userAddress={userAddress || ""} />
    </div>
  );
}
