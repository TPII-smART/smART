"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FeedActivityCard } from "@/components/Card/FeedCard/FeedCard";
import { useAccount } from "wagmi";
import Button from "~~/components/Button";
import Modal from "~~/components/Modal/Modal";
import Spinner from "~~/components/Spinner/Spinner";
import { PaginationScrollEvent, usePagination } from "~~/hooks/use-pagination";
import { castDateToTimestamp } from "~~/lib/utils";
import {
  fetchApplicationsForMyGigsPaginated,
  fetchApplicationsWithGigDetailsPaginated,
} from "~~/services/graphql/fetchers/gig/gig.service";
import { fetchHiredTalentsAndHiresPaginated } from "~~/services/graphql/fetchers/hiredTalent/hiredTalent.service";
import { ActivityItem, ActivityItemType, InteractionType } from "~~/types/feed/activityItem.type";
import { ApplicationState } from "~~/types/gig/gig-application.types";
import { Application } from "~~/types/gig/gig-application.types";
import { HiredTalent } from "~~/types/hiredTalent/hiredTalent.types";
import { Paginated, PaginationMetaArg } from "~~/types/paginated.types";
import { getFeedApplicationStatus, getFeedHiredTalentStatus } from "~~/utils/scaffold-eth/Status/getStatus";

interface Data {
  hiredTalents: HiredTalent[];
  applications: Application[];
  gigApplications: Application[];
}

interface Loading {
  hiredTalents: boolean;
  applications: boolean;
  gigApplications: boolean;
}

export default function ActivityFeed() {
  const { address: userAddress } = useAccount();
  const [loading, setLoading] = useState<Loading>({
    hiredTalents: true,
    applications: true,
    gigApplications: true,
  });
  const [data, setData] = useState<Data>({
    hiredTalents: [],
    applications: [],
    gigApplications: [],
  });
  const oldLengths = useRef<{ [key: string]: number }>({
    hiredTalents: 0,
    applications: 0,
    gigApplications: 0,
  });
  const [orderedData, setOrderedData] = useState<ActivityItem[]>([]);

  const [showModal, setShowModal] = useState(false);

  const fetchFunction = useCallback(
    async (meta: PaginationMetaArg): Promise<Paginated<HiredTalent | Application>> => {
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
        case "hiredTalents":
          return await fetchHiredTalentsAndHiresPaginated(meta, userAddress);
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

  const setDataFunction = (data: (HiredTalent | Application)[], key?: string) => {
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

  const { fetchPaginatedData, handleScroll } = usePagination<HiredTalent | Application>({
    fetchFunction,
    loadingFunction,
    setDataFunction,
    itemsPerPage: 4,
  });

  const fetch = () => {
    fetchPaginatedData(true, "hiredTalents");
    fetchPaginatedData(true, "applications");
    fetchPaginatedData(true, "gigApplications");
  };

  const fetchScroll = (event: PaginationScrollEvent) => {
    handleScroll(event, "hiredTalents");
    handleScroll(event, "applications");
    handleScroll(event, "gigApplications");
  };

  useEffect(() => {
    if (!userAddress) {
      setShowModal(true);
      return;
    } else {
      setShowModal(false);
    }
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userAddress]);

  const sortByTimestamp = <T extends { timestamp?: number }>(arr: T[]) => {
    return arr.sort((a, b) => {
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  };

  const filteredHiredTalentsData = useCallback(() => {
    if (!data?.hiredTalents) return [];

    const ret = data.hiredTalents.slice(oldLengths.current.hiredTalents).map(hiredTalent => {
      const feedInfo = getFeedHiredTalentStatus(hiredTalent, userAddress ?? "");
      return {
        id: "hiredTalent-" + hiredTalent.talentId + "-" + hiredTalent.hiredTalentId,
        primaryKey: hiredTalent.talentId,
        secondaryKey: hiredTalent.hiredTalentId,
        ...feedInfo,
        client: hiredTalent.client,
        freelancer: hiredTalent.freelancer,
        emitBy: hiredTalent.emitBy,
      };
    });

    oldLengths.current = {
      ...oldLengths.current,
      hiredTalents: data.hiredTalents.length > 0 ? data.hiredTalents.length : 0,
    };

    return sortByTimestamp(ret);
  }, [data.hiredTalents, userAddress]);

  const filteredApplicationData = useCallback(() => {
    if (!data?.applications) return [];

    const ret = data.applications.slice(oldLengths.current.applications).map(application => {
      const applicationInfo = getFeedApplicationStatus(application, userAddress ?? "");
      return {
        id: "application-" + application.applicationId + "-" + application.gigId,
        primaryKey: application.gigId,
        secondaryKey: application.applicationId,
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
        primaryKey: application.gigId,
        secondaryKey: application.applicationId,
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
    const combined = [...filteredApplicationData(), ...filteredGigApplicationData(), ...filteredHiredTalentsData()];
    return combined.sort((a, b) => Number(a.timestamp ?? 0) - Number(b.timestamp ?? 0));
  }, [filteredApplicationData, filteredGigApplicationData, filteredHiredTalentsData]);

  useEffect(() => {
    if (newData.length > 0) {
      setOrderedData(prev => {
        const merged = prev.concat(newData);
        return merged.sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
      });
    }
  }, [newData]);

  const handleHomeRedirect = () => {
    window.location.href = "/";
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between mt-12 px-10">
        <h2 className="text-2xl font-semibold text-foreground">Activity Feed</h2>
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
                timestamp: castDateToTimestamp(String(Number(activity.timestamp ?? 0) / 1000)),
              }}
            />
          ))}
        </div>
        <div className="h-6" />
        {!userAddress ? (
          <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Login to Visualize Feed" blocking={true}>
            <div className="mb-4">
              <p className="mb-2">Please connect your wallet to visualize the feed information.</p>
            </div>
            <div className="flex items-center justify-center">
              <Button variant="primary" onClick={handleHomeRedirect}>
                Go to Home
              </Button>
            </div>
          </Modal>
        ) : loading.hiredTalents || loading.applications || loading.gigApplications ? (
          <div className="flex-1 flex items-center justify-center mb-6">
            <Spinner />
          </div>
        ) : orderedData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-content-secondary text-2xl">No activity found.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
