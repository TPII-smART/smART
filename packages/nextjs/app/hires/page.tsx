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
    <div className="flex flex-col min-h-screen mt-4">
      <HiresListing userAddress={userAddress || ""} />
    </div>
  );
}
