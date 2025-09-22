"use client";

import { useEffect } from "react";
import { useParams } from "next/dist/client/components/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import GigDetail from "~~/components/Detail/GigDetail/gigDetail";
import { GigDetailType } from "~~/types/detail/detail.type";

export default function Application() {
  const { address: userAddress } = useAccount();
  const { gigId, applicationId } = useParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["applicationDetail", userAddress],
    });
  });

  return (
    <div className="flex flex-col mb-4 text-start p-4 ml-2 h-full overflow-auto">
      <h1 className="text-3xl font-bold tracking-tight text-content-primary">Application Details</h1>
      <p className="text-muted-foreground mt-2">View and manage your freelance application</p>
      <GigDetail gigId={String(gigId)} applicationId={String(applicationId)} type={GigDetailType.partial} />
    </div>
  );
}
