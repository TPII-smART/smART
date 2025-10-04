"use client";

import { useEffect, useState } from "react";
import Spinner from "@/components//Spinner/Spinner";
import HiredTalentCard from "@/components/Card/HiredTalentCard/HiredTalentCard";
import { usePagination } from "~~/hooks/use-pagination";
import { fetchHiresPaginated } from "~~/services/graphql/fetchers/hiredTalent/hiredTalent.service";
import { HiredTalent } from "~~/types/hiredTalent/hiredTalent.types";

export default function HiresListing({ userAddress }: { userAddress: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HiredTalent[]>([]);
  const { handleScroll, fetchPaginatedData } = usePagination({
    fetchFunction: fetchHiresPaginated,
    loadingFunction: setLoading,
    setDataFunction: setData,
  });

  useEffect(() => {
    if (!userAddress) {
      return;
    }

    fetchPaginatedData(true, "hires", userAddress);
  }, [userAddress, fetchPaginatedData]);

  return (
    <div
      className="w-full px-4 md:px-6 lg:px-8 mt-6 mb-6 overflow-auto max-h-[inherit]"
      onScroll={e => handleScroll(e, "hires", userAddress)}
    >
      <div className="w-full">
        {data && data.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {data.map(hiredTalent => (
                <HiredTalentCard
                  key={`${hiredTalent.hiredTalentId}-${hiredTalent.talentId}`}
                  hiredTalent={hiredTalent}
                />
              ))}
            </div>
            {loading && (
              <div className="flex items-center justify-center w-full h-64">
                <Spinner />
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-content-secondary text-lg">No hires found.</p>
            <p className="text-content-tertiary mt-2">Start by hiring freelancers for your projects.</p>
          </div>
        )}
      </div>
    </div>
  );
}
