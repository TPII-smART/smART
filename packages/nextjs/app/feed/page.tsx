"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FeedActivityCard } from "@/components/Card/FeedCard/FeedCard";
import { ApplicationState } from "@se-2/common";
import { useAccount } from "wagmi";
import Spinner from "~~/components/Spinner/Spinner";
import { PaginationScrollEvent, usePagination } from "~~/hooks/use-pagination";
import { castDateToTimestamp } from "~~/lib/utils";
import {
  fetchApplicationsForMyGigsPaginated,
  fetchApplicationsWithGigDetailsPaginated,
} from "~~/services/graphql/fetchers/gig/gig.service";
import { fetchJobsAndHiresPaginated } from "~~/services/graphql/fetchers/job/job.service";
import { ActivityItemType, InteractionType } from "~~/types/feed/activityItem.type";
import { Application } from "~~/types/gig/gig-application.types";
import { Job } from "~~/types/job/job.types";
import { Paginated, PaginationMetaArg } from "~~/types/paginated.types";
import { getFeedApplicationStatus, getFeedJobStatus } from "~~/utils/scaffold-eth/Status/getStatus";

interface Data {
  jobs: Job[];
  applications: Application[];
  gigApplications: Application[];
}

interface Loading {
  jobs: boolean;
  applications: boolean;
  gigApplications: boolean;
}

export default function ActivityFeed() {
  const { address: userAddress } = useAccount();
  console.log(userAddress);
  const [loading, setLoading] = useState<Loading>({
    jobs: true,
    applications: true,
    gigApplications: true,
  });
  const [data, setData] = useState<Data>({
    jobs: [],
    applications: [],
    gigApplications: [],
  });
  const oldLengths = useRef<{ [key: string]: number }>({
    jobs: 0,
    applications: 0,
    gigApplications: 0,
  });
  const [orderedData, setOrderedData] = useState<any[]>([]);

  const fetchFunction = useCallback(
    async (meta: PaginationMetaArg): Promise<Paginated<Job | Application>> => {
      console.log("Fetching data for key:", meta?.key);
      if (!userAddress)
        return {
          data: [],
          meta: {
            totalCount: 0,
            endCursor: null,
            startCursor: null,
            hasNextPage: true,
          },
        };

      switch (meta?.key) {
        case "jobs":
          return await fetchJobsAndHiresPaginated(meta, userAddress);
        case "applications":
          return await fetchApplicationsWithGigDetailsPaginated(meta, userAddress);
        case "gigApplications":
          return await fetchApplicationsForMyGigsPaginated(meta, userAddress);
        default:
          return {
            data: [],
            meta: {
              totalCount: 0,
              endCursor: null,
              startCursor: null,
              hasNextPage: true,
            },
          };
      }
    },
    [userAddress],
  );

  const setDataFunction = (data: (Job | Application)[], key?: string) => {
    if (!key) return;

    setData(prevData => ({
      ...prevData,
      [key]: data,
    }));
  };

  const loadingFunction = (value: boolean, key?: string) => {
    if (!key) return;

    setLoading(prevLoading => ({
      ...prevLoading,
      [key]: value,
    }));
  };

  const { fetchPaginatedData, handleScroll } = usePagination<Job | Application>({
    fetchFunction,
    loadingFunction,
    setDataFunction,
    itemsPerPage: 4,
  });

  const fetch = () => {
    fetchPaginatedData(true, "jobs");
    fetchPaginatedData(true, "applications");
    fetchPaginatedData(true, "gigApplications");
  };

  const fetchScroll = (event: PaginationScrollEvent) => {
    handleScroll(event, "jobs");
    handleScroll(event, "applications");
    handleScroll(event, "gigApplications");
  };

  useEffect(() => {
    if (!userAddress) return;
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress]);

  const sortByTimestamp = <T extends { timestamp?: number }>(arr: T[]) => {
    return arr.sort((a, b) => {
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  };

  const filteredJobsData = useCallback(() => {
    if (!data?.jobs) return [];

    const ret = data.jobs.slice(oldLengths.current.jobs).map(job => {
      const feedInfo = getFeedJobStatus(job, userAddress ?? "");
      return {
        id: "job-" + job.postingId + "-" + job.jobId,
        ...feedInfo,
        client: job.client,
        freelancer: job.freelancer,
        emitBy: job.emitBy,
      };
    });

    oldLengths.current = {
      ...oldLengths.current,
      jobs: data.jobs.length > 0 ? data.jobs.length : 0,
    };

    return sortByTimestamp(ret);
  }, [data.jobs, userAddress]);

  const filteredApplicationData = useCallback(() => {
    if (!data?.applications) return [];

    const ret = data.applications.slice(oldLengths.current.applications).map(application => {
      const applicationInfo = getFeedApplicationStatus(application, userAddress ?? "");
      return {
        id: "application-" + application.applicationId + "-" + application.gigId,
        ...applicationInfo,
        client: application.gig ? application.gig.client : userAddress,
        freelancer: application.freelancer,
        emitBy: application.state !== ApplicationState.Accepted ? application.emitBy : application.gig?.emitBy,
      };
    });

    oldLengths.current = {
      ...oldLengths.current,
      applications: data.applications.length > 0 ? data.applications.length : 0,
    };

    return sortByTimestamp(ret);
  }, [data.applications, userAddress]);

  const filteredGigApplicationData = useCallback(() => {
    if (!data?.gigApplications) return [];
    const ret = data.gigApplications.slice(oldLengths.current.gigApplications).map(application => {
      const applicationInfo = getFeedApplicationStatus(application, userAddress ?? "");
      return {
        id: "application-" + application.applicationId + "-" + application.gigId,
        ...applicationInfo,
        client: application.gig ? application.gig.client : userAddress,
        freelancer: application.freelancer,
        emitBy: application.state !== ApplicationState.Accepted ? application.emitBy : application.gig?.emitBy,
      };
    });

    oldLengths.current = {
      ...oldLengths.current,
      gigApplications: data.gigApplications.length > 0 ? data.gigApplications.length : 0,
    };

    return sortByTimestamp(ret);
  }, [data.gigApplications, userAddress]);

  const newData: any[] = useMemo(() => {
    const combined = [...filteredApplicationData(), ...filteredGigApplicationData(), ...filteredJobsData()];
    return combined.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }, [filteredApplicationData, filteredGigApplicationData, filteredJobsData]);

  useEffect(() => {
    if (newData.length > 0) {
      setOrderedData(prev => prev.concat(newData));
    }
  }, [newData]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between mt-12 px-10">
        <h2 className="text-2xl font-semibold text-foreground">Activity Feed</h2>
        {/* <Button variant="outline" size="sm">
          Mark All as Read
        </Button> */}
      </div>
      <div
        className="overflow-y-auto h-full"
        onScroll={event => fetchScroll(event as unknown as PaginationScrollEvent)}
      >
        <div className="mx-5 space-y-4 py-4 px-5 ">
          {orderedData.map(activity => (
            <FeedActivityCard
              key={activity.id}
              activity={{
                ...activity,
                type: activity.type ?? ActivityItemType.unknown,
                interactionType: activity.interactionType ?? InteractionType.unknown,
                timestamp: castDateToTimestamp(String((activity.timestamp ?? 0) / 1000)),
              }}
            />
          ))}
        </div>
        <div className="h-6" />
        {loading.jobs || loading.applications || loading.gigApplications ? (
          <div className="flex-1 flex items-center justify-center mb-6">
            <Spinner />
          </div>
        ) : (
          orderedData.length === 0 && (
            <div className="text-center py-12">
              <p className="text-content-secondary text-2xl">No activity found.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
