"use client";

import { useMemo } from "react";
import { FeedActivityCard } from "@/components/Card/FeedCard/FeedCard";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import { fetchMyJobs } from "~~/services/graphql/fetchers/job/job.service";
import { ActivityItemStatus, ActivityItemType } from "~~/types/feed/activityItem.type";
import { Job, JobStateEnum, JobsData } from "~~/types/job/job.types";

// const mockActivities: ActivityItem[] = [
//   {
//     id: "1",
//     type: ActivityItemType.application,
//     title: "New Application Submitted",
//     description: 'Applied for "React Developer for E-commerce Platform"',
//     timestamp: "2 hours ago",
//     status: JobStateEnum.WaitingForApproval,
//     client: { name: "TechCorp Inc", avatar: "https://ui-avatars.com/api/?name=User&background=random" },
//     isNew: true,
//   },
//   {
//     id: "2",
//     type: ActivityItemType.status,
//     title: "Application Accepted",
//     description: 'Your proposal for "Mobile App UI Design" has been accepted',
//     timestamp: "4 hours ago",
//     status: JobStateEnum.Ongoing,
//     client: { name: "StartupXYZ", avatar: "https://ui-avatars.com/api/?name=User&background=random" },
//     isNew: true,
//   },
//   {
//     id: "3",
//     type: ActivityItemType.message,
//     title: "New Message from Client",
//     description: "Sarah Johnson sent you a message about the project timeline",
//     timestamp: "6 hours ago",
//     client: { name: "Sarah Johnson", avatar: "https://ui-avatars.com/api/?name=User&background=random" },
//     isNew: true,
//   },
//   {
//     id: "4",
//     type: ActivityItemType.payment,
//     title: "Payment Received",
//     description: 'Payment for "Website Redesign Project" has been processed',
//     timestamp: "1 day ago",
//     status: JobStateEnum.Finished,
//     amount: 2500,
//     client: { name: "Digital Agency Pro", avatar: "https://ui-avatars.com/api/?name=User&background=random" },
//   },
//   {
//     id: "5",
//     type: ActivityItemType.view,
//     title: "Profile Viewed",
//     description: "Your profile was viewed by a potential client",
//     timestamp: "1 day ago",
//     client: { name: "Anonymous Client", avatar: "https://ui-avatars.com/api/?name=User&background=random" },
//   },
//   {
//     id: "6",
//     type: ActivityItemType.review,
//     title: "New Review Received",
//     description: "Michael Chen left a 5-star review for your work",
//     timestamp: "2 days ago",
//     client: { name: "Michael Chen", avatar: "https://ui-avatars.com/api/?name=User&background=random" },
//   },
//   {
//     id: "7",
//     type: ActivityItemType.status,
//     title: "Application Rejected",
//     description: 'Your proposal for "Logo Design Contest" was not selected',
//     timestamp: "3 days ago",
//     status: JobStateEnum.Cancelled,
//     client: { name: "Creative Studio", avatar: "https://ui-avatars.com/api/?name=User&background=random" },
//   },
// ];

const getJobDescription = (jobState: JobStateEnum, job: Job, userAddress: string) => {
  const isClient = job.client === userAddress;
  const isFreelancer = job.freelancer === userAddress;

  switch (jobState) {
    case JobStateEnum.WaitingForApproval:
      if (isClient) {
        return `You requested the service "${job.title}". Waiting for freelancer approval.`;
      } else if (isFreelancer) {
        return `New service request for "${job.title}".`;
      }
      break;

    case JobStateEnum.Cancelled:
      if (isClient) {
        return `Your request for "${job.title}" was cancelled.`;
      } else if (isFreelancer) {
        return `You cancelled the job "${job.title}".`;
      }
      break;

    case JobStateEnum.Ongoing:
      if (isClient) {
        return `Your request for "${job.title}" was accepted. Service is ongoing.`;
      } else if (isFreelancer) {
        if (job.freelancerDelivered && !job.clientReceived) {
          return `You delivered the job "${job.title}". Waiting for client review.`;
        }
        return `You accepted the job "${job.title}". Service is ongoing.`;
      }
      break;

    case JobStateEnum.Finished:
      if (isClient) {
        return `The job "${job.title}" has been completed.`;
      } else if (isFreelancer) {
        return `You completed the job "${job.title}".`;
      }
      break;

    case JobStateEnum.Disputed:
      if (isClient) {
        return `The job "${job.title}" is in dispute.`;
      } else if (isFreelancer) {
        return `The job "${job.title}" is in dispute.`;
      }
      break;

    default:
      return "Unknown job state";
  }
};

const getFeedCardTitle = (job: Job) => {
  switch (job.state) {
    case JobStateEnum.WaitingForApproval:
      return "New Application Submitted";
    case JobStateEnum.Cancelled:
      return "Job Cancelled";
    case JobStateEnum.Ongoing:
      if (job.freelancerDelivered && !job.clientReceived) {
        return "Waiting For Review";
      } else {
        return "Job Accepted";
      }
    case JobStateEnum.Finished:
      return "Job Finished";
    case JobStateEnum.Disputed:
      return "Job Disputed";
    default:
      return "Unknown Job State";
  }
};

const getType = (job: Job) => {
  switch (job.state) {
    case JobStateEnum.WaitingForApproval:
      return ActivityItemType.application;
    case JobStateEnum.Cancelled:
      return ActivityItemType.status;
    case JobStateEnum.Ongoing:
      return ActivityItemType.status;
    case JobStateEnum.Finished:
      return ActivityItemType.status;
    case JobStateEnum.Disputed:
      return ActivityItemType.status;
    default:
      return ActivityItemType.unknown;
  }
};

const castDateToTimestamp = (date: string | undefined) => {
  if (!date) return "N/A";
  const timestamp = Number(date) * 1000;
  const now = Date.now();
  const diffMs = now - timestamp;

  // if (diffMs < 0) return "In the future";

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

const getFeedCardTimeStamp = (job: Job) => {
  if (job.state === JobStateEnum.Finished) {
    return castDateToTimestamp(job.finishedAt);
  } else if (job.state === JobStateEnum.Ongoing) {
    return castDateToTimestamp(job.acceptedAt);
  } else if (job.state === JobStateEnum.WaitingForApproval) {
    return castDateToTimestamp(job.createdAt);
  } else if (job.state === JobStateEnum.Cancelled) {
    return castDateToTimestamp(job.canceledAt);
  }

  return null;
};

export default function ActivityFeed() {
  const { address: userAddress } = useAccount();

  const { data } = useQuery<JobsData>({
    queryKey: ["jobsFromUser", userAddress],
    queryFn: () => fetchMyJobs(userAddress || ""),
    refetchInterval: 1000 * 60 * 5,
  });

  console.log("ActivityFeed data", data);

  // Helper to map JobStateEnum to ActivityItem status string
  const mapJobStateToStatus = (job: Job): ActivityItemStatus | undefined => {
    switch (job.state) {
      case JobStateEnum.WaitingForApproval:
        return ActivityItemStatus.pending;
      case JobStateEnum.Ongoing:
        if (job.freelancerDelivered && !job.clientReceived) {
          return ActivityItemStatus.waitingForReview;
        } else {
          return ActivityItemStatus.accepted;
        }
      case JobStateEnum.Cancelled:
        return ActivityItemStatus.cancelled;
      case JobStateEnum.Finished:
        return ActivityItemStatus.completed;

      default:
        return undefined;
    }
  };

  const filteredData = useMemo(() => {
    if (!data?.jobs) return [];

    return data.jobs.map(job => ({
      id: job.postingId + "-" + job.jobId,
      title: getFeedCardTitle(job),
      description: getJobDescription(job.state, job, userAddress ?? ""),
      client: job.client,
      freelancer: job.freelancer,
      status: mapJobStateToStatus(job),
      timestamp: getFeedCardTimeStamp(job) ?? "",
      type: getType(job),
    }));
  }, [data]);

  console.log("Filtered Activity Data", filteredData);

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between mt-12 px-10">
        <h2 className="text-2xl font-semibold text-foreground">Activity Feed</h2>
        <Button variant="outline" size="sm">
          Mark All as Read
        </Button>
      </div>
      <div className="overflow-y-auto mx-30">
        <div className="space-y-4 py-4 px-5  overflow-visible">
          {filteredData.map(activity => (
            <FeedActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </div>
    </div>
  );
}
