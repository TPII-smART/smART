"use client";

import React, { RefObject, useEffect } from "react";
import Spinner from "@/components//Spinner/Spinner";
import { useAccount } from "wagmi";
import { GigCard } from "~~/components/Card/GigCard/GigCard";
import { usePagination } from "~~/hooks/use-pagination";
import { fetchMyGigsPaginated } from "~~/services/graphql/fetchers/gig/gig.service";
import { Gig } from "~~/types/gig/gig.types";

export default function MyGigsListing({
  userAddress,
  scrollRef,
}: {
  userAddress: string;
  scrollRef?: RefObject<HTMLDivElement | null>;
}) {
  const { address } = useAccount();
  const [gigs, setGigs] = React.useState<Gig[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);

  const isOwner = userAddress === address;
  const { handleScroll, fetchPaginatedData } = usePagination({
    loadingFunction: setLoading,
    setDataFunction: setGigs,
    fetchFunction: fetchMyGigsPaginated,
  });

  React.useEffect(() => {
    if (!userAddress) return;

    fetchPaginatedData(true, "gigs", userAddress);
  }, [userAddress, fetchPaginatedData]);

  useEffect(() => {
    if (!scrollRef) return;

    if (scrollRef.current) {
      scrollRef.current.onscroll = (e: any) => {
        handleScroll(e, "gigs", userAddress);
      };
    }
  }, [scrollRef, userAddress, handleScroll]);

  return (
    <div className="w-full px-4 md:px-6 lg:px-8 mt-6 mb-6">
      <div className="w-full">
        {gigs && gigs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {gigs.map(gig => (
                <GigCard key={gig.gigId} gig={gig} />
              ))}
            </div>
            {loading && (
              <div className="flex items-center justify-center w-full h-64">
                <Spinner />
              </div>
            )}
            <div className="h-6" />
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-content-secondary text-lg">No gigs found.</p>
            <p className="text-content-tertiary mt-2">
              {isOwner ? (
                <span>
                  Go to the Gigs section on the{" "}
                  <a href={`/browse`} className="underline">
                    Browse
                  </a>{" "}
                  page to create your first gig.
                </span>
              ) : (
                <span>This user has not posted any gigs yet.</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
