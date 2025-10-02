"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import InfoHeader from "./InfoHeader";
import Skeleton from "./Skeleton/Skeleton";
import Spinner from "@/components//Spinner/Spinner";
import JobCard from "@/components/Card/JobCard/JobCard";
import { jobState } from "@/components/Card/JobState/jobState.data";
import ComboBox from "@/components/ComboBox/ComboBox";
import { InputBase } from "@/components/scaffold-eth";
import { usePagination } from "~~/hooks/use-pagination";
import {
  fetchJobPostingAverageRating,
  fetchJobPostingById,
  fetchJobsFromPostingPaginated,
} from "~~/services/graphql/fetchers/job/job.service";
import { Job, JobPosting } from "~~/types/job/job.types";

const jobStatesWithAll = [{ id: -1, label: "All" }, ...jobState];

export default function MyJobsListing({ postingId }: { postingId: string }) {
  const searchParams = useSearchParams();
  // Initialize state from URL parameters
  const initialSearch = useMemo(() => searchParams?.get("search") || "", [searchParams]);
  const initialItemId = useMemo(() => searchParams?.get("itemId") || "", [searchParams]);
  const initialState = useMemo(
    () => (searchParams?.get("state") ? parseInt(searchParams.get("state") as string) : -1),
    [searchParams],
  );

  const [posting, setPosting] = useState<JobPosting | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { handleScroll, fetchPaginatedData } = usePagination({
    fetchFunction: fetchJobsFromPostingPaginated,
    loadingFunction: setLoading,
    setDataFunction: setJobs,
  });

  const [search, setSearch] = useState<string>(initialSearch);
  const [selectedState, setSelectedState] = useState(initialState);

  useEffect(() => {
    if (!postingId) {
      return;
    }

    fetchPaginatedData(false, `${selectedState}`, postingId, search, selectedState);
  }, [postingId, search, selectedState, fetchPaginatedData]);

  useEffect(() => {
    if (!postingId) {
      return;
    }

    fetchJobPostingById(postingId).then(result => setPosting(result));
    fetchJobPostingAverageRating(postingId).then(avg => setRating(avg));
    fetchPaginatedData(true, `${selectedState}`, postingId, search, selectedState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postingId, fetchPaginatedData]);

  return (
    <div
      className="w-full h-full flex flex-col overflow-auto"
      onScroll={e => handleScroll(e, `${selectedState}`, postingId, search, selectedState)}
    >
      <div className="px-4 md:px-6 lg:px-8">
        <div className="mt-8 mb-8">
          <Skeleton active={loading && !posting} variant="rounded" width={"100%"}>
            <InfoHeader data={{ ...posting, rating: rating } as JobPosting} />
          </Skeleton>
          <div className="mb-8 mt-8">
            <h1 className="text-xl font-bold text-content-primary mb-4 mt-6">Manage Jobs for this posting</h1>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
              <InputBase
                variant="outlined"
                placeholder={"Search Jobs by Title or Description"}
                value={search}
                onChange={setSearch}
              />
              <ComboBox
                id={"Job state"}
                label={"Filter by Job State"}
                onChange={(state: number) => {
                  setSelectedState(state);
                }}
                value={selectedState}
                options={jobStatesWithAll}
                style={{ marginTop: 8 }}
              />
            </div>
          </div>
          <div className="w-full h-full">
            {jobs && jobs.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {jobs.map(job => (
                    <JobCard key={`${job.jobId}-${job.postingId}`} job={job} highlight={initialItemId === job.jobId} />
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
                <p className="text-content-secondary text-lg">No jobs found.</p>
                <p className="text-content-tertiary mt-2">Wait for clients to request jobs from your posting.</p>
              </div>
            )}
          </div>
          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
