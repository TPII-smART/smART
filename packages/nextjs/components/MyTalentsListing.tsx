"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components//Spinner/Spinner";
import { TalentCard } from "@/components/Card/TalentCard/TalentCard";
import { useAccount } from "wagmi";
import { usePagination } from "~~/hooks/use-pagination";
import { fetchMyTalentsPaginated } from "~~/services/graphql/fetchers/hiredTalent/hiredTalent.service";
import { Talent } from "~~/types/hiredTalent/hiredTalent.types";

export default function MyTalentListing({ userAddress }: { userAddress: string }) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [talents, setTalents] = useState<Talent[]>([]);

  const { handleScroll, fetchPaginatedData } = usePagination({
    fetchFunction: fetchMyTalentsPaginated,
    loadingFunction: setLoading,
    setDataFunction: setTalents,
  });

  const isOwner = userAddress === address;

  useEffect(() => {
    if (!userAddress) return;

    fetchPaginatedData(true, "talents", userAddress);
  }, [userAddress, fetchPaginatedData]);

  return (
    <div
      className="w-full px-4 md:px-6 lg:px-8 mt-6 mb-6 overflow-auto max-h-[inherit]"
      onScroll={e => handleScroll(e, "talents", userAddress)}
    >
      <div className="w-full">
        {talents && talents.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {talents.map(talent => (
                <TalentCard key={talent.talentId} talent={talent} />
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
            <p className="text-content-secondary text-lg">No talents found.</p>
            <p className="text-content-tertiary mt-2">
              {isOwner ? (
                <span>
                  Go to the Talent section on the{" "}
                  <a href={`/browse`} className="underline">
                    Browse
                  </a>{" "}
                  page to create your first talent.
                </span>
              ) : (
                <span>This user has not posted any hiredTalents yet.</span>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
