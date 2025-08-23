"use client";

import { useMemo } from "react";
import { FeedActivityCard } from "@/components/Card/FeedCard/FeedCard";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import Spinner from "~~/components/Spinner/Spinner";
import { fetchHires, fetchMyJobs } from "~~/services/graphql/fetchers/job/job.service";
import { ActivityItemStatus, ActivityItemType } from "~~/types/feed/activityItem.type";
import { Job, JobStateEnum, JobsData } from "~~/types/job/job.types";

const getJobFeedInfo = (job: Job, userAddress: string) => {
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
      };

    case JobStateEnum.Cancelled: {
      const cancelledBy = job.emitBy;
      const client = job.client;
      const freelancer = job.freelancer;

      if (cancelledBy === client) {
        if (client === userAddress) {
          return {
            title: "You Cancelled the Job Request",
            description: `You cancelled your request for "${job.title}".`,
            type: ActivityItemType.status,
            timestamp: castDateToTimestampNum(job.canceledAt),
            status: ActivityItemStatus.cancelled,
          };
        } else if (freelancer === userAddress) {
          return {
            title: "User Cancelled the Job",
            description: `User cancelled the job "${job.title}".`,
            type: ActivityItemType.status,
            timestamp: castDateToTimestampNum(job.canceledAt),
            status: ActivityItemStatus.cancelled,
          };
        }
      } else if (cancelledBy === freelancer) {
        if (client == userAddress) {
          return {
            title: "Freelancer Cancelled the Job",
            description: `The freelancer cancelled the job "${job.title}".`,
            type: ActivityItemType.status,
            timestamp: castDateToTimestampNum(job.canceledAt),
            status: ActivityItemStatus.cancelled,
          };
        } else if (freelancer == userAddress) {
          return {
            title: "You Cancelled the Job Request",
            description: `You cancelled your request for "${job.title}".`,
            type: ActivityItemType.status,
            timestamp: castDateToTimestampNum(job.canceledAt),
            status: ActivityItemStatus.cancelled,
          };
        }
      } else {
        // Caso desconocido o datos faltantes
        return {
          title: "Job Cancelled",
          description: `The job "${job.title}" was cancelled.`,
          type: ActivityItemType.status,
          timestamp: castDateToTimestampNum(job.canceledAt),
          status: ActivityItemStatus.cancelled,
        };
      }
    }

    case JobStateEnum.Ongoing:
      // Freelancer
      if (!isClient) {
        if (!job.freelancerDelivered && !job.clientReceived) {
          return {
            title: "You Accepted a New Job",
            description: `You accepted the job "${job.title}". Service is ongoing.`,
            type: ActivityItemType.status,
            timestamp: castDateToTimestampNum(job.acceptedAt),
            status: ActivityItemStatus.accepted,
          };
        }
        if (job.freelancerDelivered && !job.clientReceived) {
          return {
            title: "Waiting for Client Approval",
            description: `You delivered the job "${job.title}". Waiting for client review.`,
            type: ActivityItemType.status,
            timestamp: castDateToTimestampNum(job.deliveredAt),
            status: ActivityItemStatus.waitingForReview,
          };
        }
      }
      // Client
      if (isClient) {
        if (!job.freelancerDelivered && !job.clientReceived) {
          return {
            title: "Freelancer Accepted Your Proposal",
            description: `Your request for "${job.title}" was accepted. Service is ongoing.`,
            type: ActivityItemType.status,
            timestamp: castDateToTimestampNum(job.acceptedAt),
            status: ActivityItemStatus.accepted,
          };
        }
        if (job.freelancerDelivered && !job.clientReceived) {
          return {
            title: "Work Delivered - Awaiting Your Approval",
            description: `The freelancer delivered the job "${job.title}". Please review and approve.`,
            type: ActivityItemType.status,
            timestamp: castDateToTimestampNum(job.deliveredAt),
            status: ActivityItemStatus.waitingForReview,
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
      };

    case JobStateEnum.Disputed:
      return {
        title: "Job in Dispute",
        description: `The job "${job.title}" is in dispute.`,
        type: ActivityItemType.status,
        timestamp: 0,
        status: ActivityItemStatus.unknown,
      };

    default:
      return {
        title: "Unknown Job State",
        description: "Unknown job state",
        type: ActivityItemType.unknown,
        timestamp: 0,
        status: ActivityItemStatus.unknown,
      };
  }
};

const castDateToTimestamp = (date: string | undefined): string => {
  if (!date) return "N/A";
  const timestamp = Number(date) * 1000;
  const now = Date.now();
  const diffMs = now - timestamp;

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffHour < 24) {
    if (diffHour < 1) {
      if (diffMin < 1) {
        return "0 minutes ago";
      }
      return `${diffMin} minutes ago`;
    }
    return `${diffHour} hours ago`;
  } else if (diffDay < 7) {
    return `${diffDay} days ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
};

const castDateToTimestampNum = (date: string | undefined) => {
  if (!date) return 0;
  const timestamp = Number(date) * 1000;
  return isNaN(timestamp) ? 0 : timestamp;
};

export default function ActivityFeed() {
  const { address: userAddress } = useAccount();

  const { data: jobData, isLoading: isLoadingJobs } = useQuery<JobsData>({
    queryKey: ["jobsFromUser", userAddress],
    queryFn: () => fetchMyJobs(userAddress || ""),
    refetchInterval: 1000 * 60 * 5,
  });

  const { data: hireData, isLoading: isLoadingHires } = useQuery<JobsData>({
    queryKey: ["HiresFromUser", userAddress],
    queryFn: () => fetchHires(userAddress || ""),
    refetchInterval: 1000 * 60 * 5,
  });

  const filteredJobData = useMemo(() => {
    if (!jobData?.jobs) return [];

    return jobData.jobs.map(job => {
      const feedInfo = getJobFeedInfo(job, userAddress ?? "");
      return {
        id: job.postingId + "-" + job.jobId,
        ...feedInfo,
        client: job.client,
        freelancer: job.freelancer,
        emitBy: job.emitBy,
      };
    });
  }, [jobData]);

  const filteredHireData = useMemo(() => {
    if (!hireData?.jobs) return [];

    return hireData.jobs.map(job => {
      const feedInfo = getJobFeedInfo(job, userAddress ?? "");
      return {
        id: job.postingId + "-" + job.jobId,
        ...feedInfo,
        client: job.client,
        freelancer: job.freelancer,
        emitBy: job.emitBy,
      };
    });
  }, [hireData]);

  const filteredData = useMemo(() => {
    return [...filteredJobData, ...filteredHireData];
  }, [filteredJobData, filteredHireData]);

  const orderedData = useMemo(() => {
    return filteredData.sort((a, b) => {
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
  }, [filteredData]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between mt-12 px-10">
        <h2 className="text-2xl font-semibold text-foreground">Activity Feed</h2>
        <Button variant="outline" size="sm">
          Mark All as Read
        </Button>
      </div>
      {isLoadingJobs && isLoadingHires ? (
        <div className="flex items-center justify-center w-full h-64">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-y-auto mx-30">
          <div className="space-y-4 py-4 px-5  overflow-visible">
            {orderedData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-content-secondary text-lg">No activity found.</p>
              </div>
            )}
            {orderedData.map(activity => (
              <FeedActivityCard
                key={activity.id}
                activity={{
                  ...activity,
                  type: activity.type ?? ActivityItemType.unknown,
                  timestamp: castDateToTimestamp(String((activity.timestamp ?? 0) / 1000)),
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
