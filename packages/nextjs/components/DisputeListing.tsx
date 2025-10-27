"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DisputeCard } from "@/components/Card/DisputeCard/DisputeCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { useGlobalSpinner } from "~~/context/SpinnerProvider";
import { usePagination } from "~~/hooks/use-pagination";
import {
  fetchAppelableDisputesWithContributors,
  fetchDisputesContributedByUserPaginated,
} from "~~/services/graphql/fetchers/dispute/dispute.service";
import { Dispute } from "~~/types/dispute/dispute.type";

interface DisputePageProps {
  type: "Appelable" | "participated";
}

export default function DisputeListing({ type }: DisputePageProps) {
  const queryClient = useQueryClient();
  const { address: userAddress } = useAccount();
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<Dispute[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  //const { showSpinner, hideSpinner } = useGlobalSpinner();

  const fetchFunction = useMemo(
    () => (type === "Appelable" ? fetchAppelableDisputesWithContributors : fetchDisputesContributedByUserPaginated),
    [type, userAddress],
  );

  const { handleScroll, fetchPaginatedData, paginationPushFront } = usePagination<Dispute>({
    fetchFunction,
    loadingFunction: setLoading,
    setDataFunction: setData,
  });

  useEffect(() => {
    if (type === "participated" && !userAddress) return;
    fetchPaginatedData(true, "disputes", type === "participated" ? userAddress! : undefined);
  }, [type, userAddress, fetchPaginatedData]);

  return (
    <div className="h-full pb-30 bg-background">
      {/* Disputes Grid */}
      <div className="mx-auto px-4 py-12 sm:px-6 lg:px-8 overflow-y-auto h-full">
        <div className="grid gap-6 grid-cols-1 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1536px]:grid-cols-4">
          {data?.map(dispute => (
            <DisputeCard key={dispute.disputeId} dispute={dispute} />
          ))}
        </div>

        {/* Empty State */}
        {data?.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg  bg-card/50 py-12">
            <p className="text-lg text-muted-foreground">No disputes found</p>
            <p className="mt-1 text-sm text-muted-foreground">All your projects are running smoothly!</p>
          </div>
        )}
      </div>
    </div>
  );
}
