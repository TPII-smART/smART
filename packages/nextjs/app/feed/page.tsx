"use client";

import { useMemo } from "react";
import { FeedActivityCard } from "@/components/Card/FeedCard/FeedCard";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import Spinner from "~~/components/Spinner/Spinner";
import { fetchMyJobs } from "~~/services/graphql/fetchers/job/job.service";
import { ActivityItemStatus, ActivityItemType } from "~~/types/feed/activityItem.type";
import { Job, JobStateEnum, JobsData } from "~~/types/job/job.types";

const getJobFeedInfo = (job: Job, userAddress: string) => {
  const isClient = job.client === userAddress;
  //const isFreelancer = job.freelancer === userAddress;

  switch (job.state) {
    case JobStateEnum.WaitingForApproval:
      return {
        title: isClient ? "Service Requested" : "New Service Request Received",
        description: isClient
          ? `You requested the service "${job.title}". Waiting for freelancer approval.`
          : `New service request for "${job.title}".`,
        type: ActivityItemType.application,
        timestamp: castDateToTimestamp(job.createdAt),
        status: ActivityItemStatus.pending,
      };

    case JobStateEnum.Cancelled:
      return {
        title: isClient ? "Job Request Cancelled" : "Job Cancelled",
        description: isClient
          ? `Your request for "${job.title}" was cancelled.`
          : `You cancelled the job "${job.title}".`,
        type: ActivityItemType.status,
        timestamp: castDateToTimestamp(job.canceledAt),
        status: ActivityItemStatus.cancelled,
      };

    case JobStateEnum.Ongoing:
      return {
        title: isClient
          ? "Freelancer Accepted Your Proposal"
          : job.freelancerDelivered && !job.clientReceived
            ? "Waiting For Review"
            : "You Accepted a New Job",
        description: isClient
          ? `Your request for "${job.title}" was accepted. Service is ongoing.`
          : job.freelancerDelivered && !job.clientReceived
            ? `You delivered the job "${job.title}". Waiting for client review.`
            : `You accepted the job "${job.title}". Service is ongoing.`,
        type: ActivityItemType.status,
        timestamp: castDateToTimestamp(job.acceptedAt),
        status:
          job.freelancerDelivered && !job.clientReceived
            ? ActivityItemStatus.waitingForReview
            : ActivityItemStatus.accepted,
      };

    case JobStateEnum.Finished:
      return {
        title: isClient ? "Job Completed" : "You Completed a Job",
        description: isClient ? `The job "${job.title}" has been completed.` : `You completed the job "${job.title}".`,
        type: ActivityItemType.status,
        timestamp: castDateToTimestamp(job.finishedAt),
        status: ActivityItemStatus.completed,
      };

    case JobStateEnum.Disputed:
      return {
        title: "Job in Dispute",
        description: `The job "${job.title}" is in dispute.`,
        type: ActivityItemType.status,
        timestamp: "N/A",
        status: ActivityItemStatus.unknown,
      };

    default:
      return {
        title: "Unknown Job State",
        description: "Unknown job state",
        type: ActivityItemType.unknown,
        timestamp: "N/A",
        status: ActivityItemStatus.unknown,
      };
  }
};

const castDateToTimestamp = (date: string | undefined) => {
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
      return `${diffMin} minutes ago`;
    }
    return `${diffHour} hours ago`;
  } else if (diffDay < 7) {
    return `${diffDay} days ago`;
  } else {
    return new Date(timestamp).toLocaleDateString();
  }
};

export default function ActivityFeed() {
  const { address: userAddress } = useAccount();

  const { data, isLoading } = useQuery<JobsData>({
    queryKey: ["jobsFromUser", userAddress],
    queryFn: () => fetchMyJobs(userAddress || ""),
    refetchInterval: 1000 * 60 * 5,
  });

  const filteredData = useMemo(() => {
    if (!data?.jobs) return [];

    return data.jobs.map(job => {
      const feedInfo = getJobFeedInfo(job, userAddress ?? "");
      return {
        id: job.postingId + "-" + job.jobId,
        ...feedInfo,
        client: job.client,
        freelancer: job.freelancer,
      };
    });
  }, [data]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between mt-12 px-10">
        <h2 className="text-2xl font-semibold text-foreground">Activity Feed</h2>
        <Button variant="outline" size="sm">
          Mark All as Read
        </Button>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center w-full h-64">
          <Spinner />
        </div>
      ) : (
        <div className="overflow-y-auto mx-30">
          <div className="space-y-4 py-4 px-5  overflow-visible">
            {filteredData.length === 0 && (
              <div className="text-center py-12">
                <p className="text-content-secondary text-lg">No activity found.</p>
              </div>
            )}
            {filteredData.map(activity => (
              <FeedActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
