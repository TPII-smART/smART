"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InfoHeader from "./InfoHeader";
import Skeleton from "./Skeleton/Skeleton";
import Spinner from "@/components//Spinner/Spinner";
import HiredTalentCard from "@/components/Card/HiredTalentCard/HiredTalentCard";
import { hiredTalentState } from "@/components/Card/HiredTalentState/hiredTalentState.data";
import ComboBox from "@/components/ComboBox/ComboBox";
import { InputBase } from "@/components/scaffold-eth";
import { usePagination } from "~~/hooks/use-pagination";
import {
  fetchHiredTalentsFromTalentPaginated,
  fetchTalentAverageRating,
  fetchTalentById,
} from "~~/services/graphql/fetchers/hiredTalent/hiredTalent.service";
import { HiredTalent, Talent } from "~~/types/hiredTalent/hiredTalent.types";

const hiredTalentStatesWithAll = [{ id: -1, label: "All" }, ...hiredTalentState];

export default function MyHiredTalentsListing({ talentId }: { talentId: string }) {
  const searchParams = useSearchParams();
  const initialSearch = useMemo(() => searchParams?.get("search") || "", [searchParams]);
  const initialItemId = useMemo(() => searchParams?.get("itemId") || "", [searchParams]);
  const initialState = useMemo(
    () => (searchParams?.get("state") ? parseInt(searchParams.get("state") as string) : -1),
    [searchParams],
  );

  const router = useRouter();
  const [talent, setTalent] = useState<Talent | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [hiredTalents, setHiredTalents] = useState<HiredTalent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isValidating, setIsValidating] = useState<boolean>(true);
  const { handleScroll, fetchPaginatedData } = usePagination({
    fetchFunction: fetchHiredTalentsFromTalentPaginated,
    loadingFunction: setLoading,
    setDataFunction: setHiredTalents,
  });

  const [search, setSearch] = useState<string>(initialSearch);
  const [selectedState, setSelectedState] = useState(initialState);

  useEffect(() => {
    if (!talentId) {
      router.replace("/404");
      return;
    }

    setIsValidating(true);
    fetchTalentById(talentId).then(result => {
      if (!result) {
        router.replace("/404");
        return;
      }
      setTalent(result);
      setIsValidating(false);
    });
    fetchTalentAverageRating(talentId).then(avg => setRating(avg));
    fetchPaginatedData(true, `${selectedState}`, talentId, search, selectedState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talentId, fetchPaginatedData]);

  useEffect(() => {
    if (!talentId || isValidating) {
      return;
    }

    fetchPaginatedData(false, `${selectedState}`, talentId, search, selectedState);
  }, [talentId, search, selectedState, fetchPaginatedData, isValidating]);

  return (
    <div
      className="w-full h-full flex flex-col overflow-auto"
      onScroll={e => handleScroll(e, `${selectedState}`, talentId, search, selectedState)}
    >
      <div className="px-4 md:px-6 lg:px-8">
        <div className="mt-8 mb-8">
          <Skeleton active={(loading && !talent) || isValidating} variant="rounded" width={"100%"}>
            <InfoHeader data={{ ...talent, rating: rating } as Talent} />
          </Skeleton>
          <div className="mb-8 mt-8">
            <h1 className="text-xl font-bold text-content-primary mb-4 mt-6">Manage hires for this talent</h1>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <InputBase
                variant="outlined"
                placeholder={"Search hires by Title or Description"}
                value={search}
                onChange={(e: any) => {
                  const newValue = typeof e === "string" ? e : (e?.target?.value ?? "");
                  setSearch(newValue);
                }}
              />
              <ComboBox
                id={"HiredTalent state"}
                label={"Filter by Hire State"}
                onChange={(state: number) => {
                  setSelectedState(state);
                }}
                value={selectedState}
                options={hiredTalentStatesWithAll}
                style={{ marginTop: 8 }}
              />
            </div>
          </div>
          <div className="w-full h-full">
            {hiredTalents && hiredTalents.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {hiredTalents.map(hiredTalent => (
                    <HiredTalentCard
                      key={`${hiredTalent.hiredTalentId}-${hiredTalent.talentId}`}
                      hiredTalent={hiredTalent}
                      highlight={initialItemId === hiredTalent.hiredTalentId}
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
                <p className="text-content-tertiary mt-2">Wait for clients to request hires from your talent.</p>
              </div>
            )}
          </div>
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
