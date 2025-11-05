"use client";

import { useEffect, useMemo, useState } from "react";
import Spinner from "./Spinner/Spinner";
import { DisputeCard } from "@/components/Card/DisputeCard/DisputeCard";
import { useAccount } from "wagmi";
import { usePagination } from "~~/hooks/use-pagination";
import {
  fetchAppelableDisputesWithContributors,
  fetchDisputesContributedByUserPaginated,
} from "~~/services/graphql/fetchers/dispute/dispute.service";
import { Dispute } from "~~/types/dispute/dispute.type";

interface DisputePageProps {
  type: "Appealable" | "contributed";
}

export default function DisputeListing({ type }: DisputePageProps) {
  const { address: userAddress } = useAccount();
  const [loading, setLoading] = useState<boolean>(true);
  const [data, setData] = useState<Dispute[]>([]);

  const fetchFunction = useMemo(
    () => (type === "Appealable" ? fetchAppelableDisputesWithContributors : fetchDisputesContributedByUserPaginated),
    [type],
  );

  const { handleScroll, fetchPaginatedData } = usePagination<Dispute>({
    fetchFunction,
    loadingFunction: setLoading,
    setDataFunction: setData,
    itemsPerPage: 20,
  });

  useEffect(() => {
    if (type === "contributed" && !userAddress) return;
    fetchPaginatedData(true, "disputes", type === "contributed" ? userAddress! : undefined);
  }, [type, userAddress, fetchPaginatedData]);

  return (
    <div className="h-full pb-30 bg-background">
      {/* Disputes Grid */}
      <div
        className="mx-auto px-4 py-12 sm:px-6 lg:px-8 overflow-y-auto h-full"
        onScroll={event => handleScroll(event, "disputes", type === "contributed" ? userAddress! : undefined)}
      >
        <div className="grid gap-6 grid-cols-1 min-[640px]:grid-cols-2 min-[1024px]:grid-cols-3 min-[1536px]:grid-cols-4">
          {data?.map(dispute => (
            <DisputeCard key={dispute.disputeId} dispute={dispute} />
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center w-full h-64">
            <Spinner />
          </div>
        )}

        {/* Empty State */}
        {data?.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center rounded-lg  bg-card/50 py-12">
            <p className="text-lg text-muted-foreground">No disputes found</p>
            <p className="mt-1 text-sm text-muted-foreground">All your projects are running smoothly!</p>
          </div>
        )}
      </div>
    </div>
  );
}
