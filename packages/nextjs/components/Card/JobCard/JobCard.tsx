import React from "react";
import type { JobCardProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import { cn } from "@/lib/utils";
import { JobState } from "@se-2/common";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { getJobStatus } from "~~/utils/scaffold-eth/Status/getStatus";

const JobCard = React.memo(({ job, className, highlight }: JobCardProps) => {
  const { address: userAddress } = useAccount();
  const jobStatus = job.state as JobState;

  const postingId = job.postingId ? BigInt(job.postingId) : undefined;
  const jobId = job.jobId ? BigInt(job.jobId) : undefined;
  const jobState = job.state as JobState;

  const isFreelancer = job.freelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isClient = job.client?.toLowerCase() === userAddress?.toLowerCase();

  const statusInfo = getJobStatus(jobState, job, isFreelancer, isClient);
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
    jobStatus === JobState.Ongoing
      ? deadlineFormatted
        ? `Deadline: ${deadlineFormatted}`
        : "Deadline not set"
      : jobStatus === JobState.WaitingForApproval
        ? `Client expected duration: ${job.jobDuration} hours`
        : undefined;

  return (
    <>
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
        highlight={highlight}
        onClickCardAction={handleCardClick}
      />
    </>
  );
});

JobCard.displayName = "JobCard";

export default JobCard;
