"use client";

import { useEffect } from "react";
import { useParams } from "next/dist/client/components/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import HiredTalentDetail from "~~/components/Detail/HiredTalentDetail/HiredTalentDetail";

export default function Talent() {
  const { address: userAddress } = useAccount();
  const { talentId, hiredTalentId } = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["hiredTalentDetail", userAddress],
    });
  });

  return (
    <div className="flex flex-col mb-4 text-start p-4 ml-2 h-full overflow-auto">
      <h1 className="text-3xl font-bold tracking-tight text-content-primary">Hire Details</h1>
      <p className="text-muted-foreground mt-2">View and manage your freelance hire</p>
      <HiredTalentDetail talentId={String(talentId)} hiredTalentId={String(hiredTalentId)} />
    </div>
  );
}
