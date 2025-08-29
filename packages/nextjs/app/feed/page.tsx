"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FeedActivityCard } from "@/components/Card/FeedCard/FeedCard";
import { useAccount } from "wagmi";
//import Button from "~~/components/Button/Button";
import Spinner from "~~/components/Spinner/Spinner";
import { PaginationScrollEvent, usePagination } from "~~/hooks/use-pagination";
import { castDateToTimestamp, castDateToTimestampNum } from "~~/lib/utils";
import {
  fetchApplicationsForMyGigsPaginated,
  fetchApplicationsWithGigDetailsPaginated,
} from "~~/services/graphql/fetchers/gig/gig.service";
import { fetchJobsAndHiresPaginated } from "~~/services/graphql/fetchers/job/job.service";
import { ActivityItemStatus, ActivityItemType, InteractionType } from "~~/types/feed/activityItem.type";
import { Application, ApplicationState } from "~~/types/gig/gig-application.types";
import { GigStateEnum } from "~~/types/gig/gig.types";
import { Job, JobStateEnum } from "~~/types/job/job.types";
import { Paginated, PaginationMetaArg } from "~~/types/paginated.types";

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

const getJobInfo = (job: Job, userAddress: string) => {
  const isClient = job.client === userAddress;

  switch (job.state) {
    case JobStateEnum.WaitingForApproval:
      return {
        title: isClient ? "Service Requested" : "New Service Request Received",
        description: isClient
          ? `You requested the service "${job.title}". Waiting for freelancer approval.`
          : `New service request for "${job.title}".`,
        type: ActivityItemType.application,
        timestamp: castDateToTimestampNum(job.createdAt),
        status: ActivityItemStatus.pending,
        interactionType: InteractionType.job,
      };

    case JobStateEnum.Cancelled: {
      const cancelledBy = job.emitBy;
      const client = job.client;
      const freelancer = job.freelancer;

      const cancelledActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(job.canceledAt),
        status: ActivityItemStatus.cancelled,
        interactionType: InteractionType.job,
      };

      if (cancelledBy === client) {
        if (client === userAddress) {
          return {
            title: "You Cancelled the Job Request",
            description: `You cancelled your request for "${job.title}".`,
            ...cancelledActivity,
          };
        } else if (freelancer === userAddress) {
          return {
            title: "User Cancelled the Job",
            description: `User cancelled the job "${job.title}".`,
            ...cancelledActivity,
          };
        }
      } else if (cancelledBy === freelancer) {
        if (client == userAddress) {
          return {
            title: "Freelancer Cancelled the Job",
            description: `The freelancer cancelled the job "${job.title}".`,
            ...cancelledActivity,
          };
        } else if (freelancer == userAddress) {
          return {
            title: "You Cancelled the Job Request",
            description: `You cancelled your request for "${job.title}".`,
            ...cancelledActivity,
          };
        }
      } else {
        return {
          title: "Job Cancelled",
          description: `The job "${job.title}" was cancelled.`,
          ...cancelledActivity,
        };
      }
    }

    case JobStateEnum.Ongoing:
      // Freelancer

      const acceptedActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(job.acceptedAt),
        status: ActivityItemStatus.accepted,
        interactionType: InteractionType.job,
      };

      const deliveredActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(job.deliveredAt),
        status: ActivityItemStatus.waitingForReview,
        interactionType: InteractionType.job,
      };

      if (!isClient) {
        if (!job.freelancerDelivered && !job.clientReceived) {
          return {
            title: "You Accepted a New Job",
            description: `You accepted the job "${job.title}". Service is ongoing.`,
            ...acceptedActivity,
          };
        }
        if (job.freelancerDelivered && !job.clientReceived) {
          return {
            title: "Waiting for Client Approval",
            description: `You delivered the job "${job.title}". Waiting for client review.`,
            ...deliveredActivity,
          };
        }
      }
      // Client
      if (isClient) {
        if (!job.freelancerDelivered && !job.clientReceived) {
          return {
            title: "Freelancer Accepted Your Proposal",
            description: `Your request for "${job.title}" was accepted. Service is ongoing.`,
            ...acceptedActivity,
          };
        }
        if (job.freelancerDelivered && !job.clientReceived) {
          return {
            title: "Work Delivered - Awaiting Your Approval",
            description: `The freelancer delivered the job "${job.title}". Please review and approve.`,
            ...deliveredActivity,
          };
        }
      }
      break;

    case JobStateEnum.Finished:
      return {
        title: isClient ? "Job Completed" : "You Completed a Job",
        description: isClient ? `The job "${job.title}" has been completed.` : `You completed the job "${job.title}".`,
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(job.finishedAt),
        status: ActivityItemStatus.completed,
        interactionType: InteractionType.job,
      };

    case JobStateEnum.Disputed:
      return {
        title: "Job in Dispute",
        description: `The job "${job.title}" is in dispute.`,
        type: ActivityItemType.status,
        timestamp: 0,
        status: ActivityItemStatus.unknown,
        interactionType: InteractionType.job,
      };

    default:
      return {
        title: "Unknown Job State",
        description: "Unknown job state",
        type: ActivityItemType.unknown,
        timestamp: 0,
        status: ActivityItemStatus.unknown,
        interactionType: InteractionType.job,
      };
  }
};

const getGigInfo = (application: Application, userAddress: string) => {
  const gig = application.gig;
  const isClient = gig?.client === userAddress;
  const isFreelancer = application.freelancer === userAddress;

  switch (gig?.state) {
    case GigStateEnum.Open:
      if (isClient) {
        return {
          title: "Gig Published",
          description: `Your gig "${gig.title}" is published and waiting for freelancer proposals.`,
          type: ActivityItemType.status,
          timestamp: castDateToTimestampNum(gig.createdAt),
          status: ActivityItemStatus.pending,
          interactionType: InteractionType.gig,
        };
      }
      break;

    case GigStateEnum.InProgress:
      const acceptedActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(gig.acceptedAt),
        status: ActivityItemStatus.accepted,
        interactionType: InteractionType.gig,
      };

      const waitingForApprovalActivity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(gig.deliveredAt),
        status: ActivityItemStatus.waitingForReview,
        interactionType: InteractionType.gig,
      };

      if (isFreelancer) {
        if (!gig.freelancerDelivered && !gig.clientReceived) {
          return {
            title: "You Were Selected for a Gig",
            description: `You were chosen to work on "${gig.title}". Start working and deliver when ready.`,
            ...acceptedActivity,
          };
        }
        if (gig.freelancerDelivered && !gig.clientReceived) {
          return {
            title: "Work Delivered - Awaiting Client Approval",
            description: `You delivered the gig "${gig.title}". Waiting for client review.`,
            ...waitingForApprovalActivity,
          };
        }
      }
      if (isClient) {
        if (!gig.freelancerDelivered && !gig.clientReceived) {
          return {
            title: "Freelancer Selected",
            description: `You selected a freelancer for "${gig.title}". Work is in progress.`,
            ...acceptedActivity,
          };
        }
        if (gig.freelancerDelivered && !gig.clientReceived) {
          return {
            title: "Work Delivered by Freelancer",
            description: `The freelancer delivered the gig "${gig.title}". Please review and approve.`,
            ...waitingForApprovalActivity,
          };
        }
      }
      break;

    case GigStateEnum.Completed:
      return {
        title: isClient ? "Gig Completed" : "You Completed a Gig",
        description: isClient
          ? `You approved the work for "${gig.title}". The gig is now completed.`
          : `The client approved your work for "${gig.title}". The gig is now completed.`,
        type: ActivityItemType.status,
        status: ActivityItemStatus.completed,
        timestamp: castDateToTimestampNum(gig.finishedAt),
        interactionType: InteractionType.gig,
      };

    case GigStateEnum.Cancelled: {
      const client = gig.client?.toLowerCase();
      const freelancer = application.freelancer?.toLowerCase();
      const cancelledBy = gig.emitBy?.toLowerCase();
      const user = userAddress?.toLowerCase();

      const activity = {
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(gig.canceledAt),
        status: ActivityItemStatus.cancelled,
        interactionType: InteractionType.gig,
      };

      if (cancelledBy === client) {
        if (user === client) {
          return {
            title: "You Cancelled the Gig",
            description: `You cancelled your gig "${gig.title}".`,
            ...activity,
          };
        } else if (user === freelancer) {
          return {
            title: "Client Cancelled the Gig",
            description: `The client cancelled the gig "${gig.title}".`,
            ...activity,
          };
        } else if (user === freelancer) {
          return {
            title: "Client Cancelled the Gig",
            description: `The client cancelled the gig "${gig.title}".`,
            ...activity,
          };
        }
      } else if (cancelledBy === freelancer) {
        if (user === client) {
          return {
            title: "Freelancer Cancelled the Gig",
            description: `The freelancer cancelled the gig "${gig.title}".`,
            ...activity,
          };
        } else if (user === freelancer) {
          return {
            title: "You Cancelled the Gig",
            description: `You cancelled your participation in the gig "${gig.title}".`,
            ...activity,
          };
        }
      }

      return {
        title: "Gig Cancelled",
        description: `The gig "${gig.title}" was cancelled.`,
        ...activity,
      };
    }

    default:
      return {
        title: "Unknown Gig State",
        description: "Unknown gig state",
        type: ActivityItemType.unknown,
        timestamp: 0,
        status: ActivityItemStatus.unknown,
        interactionType: InteractionType.gig,
      };
  }
};

const getApplicationInfo = (application: Application, userAddress: string) => {
  const isFreelancer = application.freelancer === userAddress;

  switch (application.state) {
    case ApplicationState.Pending:
      return {
        title: isFreelancer ? "You Applied to a Gig" : "New Application Received",
        description: isFreelancer
          ? `You applied to the gig "${application.gig?.title}". Waiting for client selection.`
          : `A freelancer applied to your gig "${application.gig?.title}".`,
        type: ActivityItemType.application,
        timestamp: castDateToTimestampNum(application.createdAt),
        status: ActivityItemStatus.pending,
        interactionType: InteractionType.gig,
      };

    case ApplicationState.Accepted:
      return getGigInfo(application, userAddress);

    case ApplicationState.Rejected:
      return {
        title: isFreelancer ? "Your Application Was Rejected" : "Application Rejected",
        description: isFreelancer
          ? `Your application for "${application.gig?.title}" was rejected.`
          : `You rejected an application for "${application.gig?.title}".`,
        type: ActivityItemType.status,
        timestamp: castDateToTimestampNum(application.rejectAt),
        status: ActivityItemStatus.rejected,
        interactionType: InteractionType.gig,
      };

    default:
      return {
        title: "Unknown Application State",
        description: "Unknown application state",
        type: ActivityItemType.unknown,
        timestamp: 0,
        status: ActivityItemStatus.unknown,
        interactionType: InteractionType.gig,
      };
  }
};

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
      const feedInfo = getJobInfo(job, userAddress ?? "");
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
      const applicationInfo = getApplicationInfo(application, userAddress ?? "");
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
      const applicationInfo = getApplicationInfo(application, userAddress ?? "");
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
    return [...filteredApplicationData(), ...filteredGigApplicationData(), ...filteredJobsData()];
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
        <div className="mx-30 space-y-4 py-4 px-5 ">
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
