import type { JobCardProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import { cn } from "@/lib/utils";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PlayIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { JobStateEnum } from "~~/types/job/job.types";

export default function JobCard({ job, className }: JobCardProps) {
  const { address: userAddress } = useAccount();
  const jobStatus = job.state as JobStateEnum;

  const postingId = job.postingId ? BigInt(job.postingId) : undefined;
  const jobId = job.jobId ? BigInt(job.jobId) : undefined;

  const isFreelancer = job.freelancer?.toLowerCase() === userAddress?.toLowerCase();

  const getJobStatus = () => {
    if (jobStatus === JobStateEnum.WaitingForApproval) {
      return {
        label: "Waiting for Approval",
        color: "bg-amber-500",
        icon: ClockIcon,
        description: isFreelancer ? "Waiting for client approval" : "Awaiting your approval",
      };
    }

    if (jobStatus === JobStateEnum.Ongoing) {
      // Check delivery status for ongoing jobs
      if (job.freelancerDelivered && job.clientReceived) {
        return {
          label: "Completed - Awaiting Payment",
          color: "bg-blue-500",
          icon: CheckCircleIcon,
          description: "Work delivered and received",
        };
      } else if (job.freelancerDelivered && !job.clientReceived) {
        return {
          label: "Delivered - Awaiting Review",
          color: "bg-purple-500",
          icon: PaperAirplaneIcon,
          description: "Work delivered, awaiting client review",
        };
      } else if (!job.freelancerDelivered && job.clientReceived) {
        return {
          label: "In Progress - Client Ready",
          color: "bg-green-500",
          icon: PlayIcon,
          description: "Client ready, awaiting delivery",
        };
      } else {
        return {
          label: "In Progress",
          color: "bg-green-500",
          icon: PlayIcon,
          description: "Work in progress",
        };
      }
    }

    if (jobStatus === JobStateEnum.Finished) {
      return {
        label: "Completed",
        color: "bg-emerald-500",
        icon: CheckCircleIcon,
        description: "Job successfully completed",
      };
    }

    if (jobStatus === JobStateEnum.Cancelled) {
      return {
        label: "Cancelled",
        color: "bg-red-500",
        icon: XCircleIcon,
        description: "Job was cancelled",
      };
    }

    return {
      label: "Unknown",
      color: "bg-gray-500",
      icon: ExclamationTriangleIcon,
      description: "Unknown status",
    };
  };

  const statusInfo = getJobStatus();
  const StatusIcon = statusInfo.icon;

  const handleCardClick = () => {
    if (postingId != null && jobId != null) {
      window.location.href = `/job-posting/${postingId}/${jobId}`;
    }
  };

  // Payment display formatting
  const formatEthPrice = (wei: bigint) => {
    const eth = formatEther(wei);
    const num = parseFloat(eth);
    if (num === 0) return "Free";
    if (num < 0.001) return `${num.toFixed(6)} ETH`;
    if (num < 1) return `${num.toFixed(4)} ETH`;
    return `${num.toFixed(3)} ETH`;
  };

  const paymentDisplay = (
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-content-primary">
        {job.payment ? formatEthPrice(BigInt(job.payment)) : "Free"}
      </span>
    </div>
  );

  // Status display for footer left
  const statusDisplay = (
    <div className="flex items-center gap-2">
      <div className={cn("h-3 w-3 rounded-full", statusInfo.color)}></div>
      <span className="text-sm font-medium text-content-secondary">{statusInfo.label}</span>
      <StatusIcon className="h-4 w-4 text-content-tertiary" />
    </div>
  );

  const deadlineFormatted = job.deadline
    ? new Date(Number(job.deadline) * 1000).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;

  const deadlineText =
    jobStatus === JobStateEnum.Ongoing
      ? deadlineFormatted
        ? `Deadline: ${deadlineFormatted}`
        : "Deadline not set"
      : jobStatus === JobStateEnum.WaitingForApproval
        ? `Client expected duration: ${job.jobDuration} hours`
        : undefined;

  return (
    <UniversalCard
      bannerUrl={job.bannerImageHash}
      avatarAddress={isFreelancer ? job.client : job.freelancer}
      title={job.title || "Untitled Job"}
      description={job.description || "No description provided"}
      extraInfo={deadlineText}
      time={job.jobDuration}
      timeLabel="Client expected duration"
      category={job.category}
      paymentDisplay={paymentDisplay}
      footerLeft={statusDisplay}
      className={className}
      cardVariant="Reduced"
      onClickCardAction={handleCardClick}
    />
  );
}
