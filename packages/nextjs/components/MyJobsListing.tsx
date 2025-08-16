"use client";

import { useCallback, useEffect, useState } from "react";
import Spinner from "@/components//Spinner/Spinner";
import JobCard from "@/components/Card/JobCard/JobCard";
import { jobState } from "@/components/Card/JobState/jobState.data";
import ComboBox from "@/components/ComboBox/ComboBox";
import { InputBase } from "@/components/scaffold-eth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchJobsFromPosting } from "~~/services/graphql/fetchers/job/job.service";
import { JobStateEnum, JobsData } from "~~/types/job/job.types";

export default function MyJobsListing({ postingId }: { postingId: string }) {
  const queryClient = useQueryClient();
  const { data, isLoading, refetch } = useQuery<JobsData>({
    queryKey: ["jobsFromJobPosting", postingId],
    queryFn: () => fetchJobsFromPosting(postingId),
  });

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["jobsFromJobPosting", postingId] });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to ensure UI updates
    await refetch();
  };

  const filterJobsByState = useCallback(
    (state: number) => {
      if (!data || !data.jobs) return [];
      return data.jobs.filter(job => job.state === state);
    },
    [data],
  );

  const [form, setForm] = useState({
    currentSelectedState: JobStateEnum.WaitingForApproval, // Defaults to pending Jobs
    filteredJobs: data?.jobs || [],
  });

  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    setForm(prev => ({
      ...prev,
      filteredJobs: filterJobsByState(prev.currentSelectedState),
    }));
  }, [filterJobsByState, isLoading]);

  useEffect(() => {
    if (search === "") {
      setForm(prev => ({
        ...prev,
        filteredJobs: filterJobsByState(prev.currentSelectedState),
      }));
    } else {
      const filtered = (data?.jobs || []).filter(
        job =>
          job.title?.toLowerCase().includes(search.toLowerCase()) ||
          job.description?.toLowerCase().includes(search.toLowerCase()),
      );
      setForm(prev => ({
        ...prev,
        filteredJobs: filtered,
      }));
    }
  }, [search, data, filterJobsByState]);

  return (
    <div className="w-full px-4 md:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-content-primary mb-12">Manage Jobs for this posting</h1>
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
              setForm(prev => ({
                ...prev,
                currentSelectedState: state,
                filteredJobs: filterJobsByState(state),
              }));
            }}
            value={form.currentSelectedState}
            options={jobState}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center w-full h-64">
          <Spinner />
        </div>
      ) : (
        <div className="w-full">
          {form.filteredJobs && form.filteredJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {form.filteredJobs.map(job => (
                <JobCard key={`${job.jobId}-${job.postingId}`} job={job} reload={reload} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-content-secondary text-lg">No jobs found.</p>
              <p className="text-content-tertiary mt-2">Wait for clients to request jobs from your posting.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
