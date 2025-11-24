import React from "react";
import type { HiredTalentCardProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import { cn } from "@/lib/utils";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { HiredTalentState } from "~~/types/hiredTalent/hiredTalent.types";
import { getHiredTalentStatus } from "~~/utils/scaffold-eth/Status/getStatus";

const HiredTalentCard = React.memo(({ hiredTalent, className, highlight }: HiredTalentCardProps) => {
  const { address: userAddress } = useAccount();
  const hiredTalentStatus = hiredTalent.state as HiredTalentState;

  const talentId = hiredTalent.talentId ? BigInt(hiredTalent.talentId) : undefined;
  const hiredTalentId = hiredTalent.hiredTalentId ? BigInt(hiredTalent.hiredTalentId) : undefined;
  const hiredTalentState = hiredTalent.state as HiredTalentState;

  const isFreelancer = hiredTalent.freelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isClient = hiredTalent.client?.toLowerCase() === userAddress?.toLowerCase();

  const statusInfo = getHiredTalentStatus(hiredTalentState, hiredTalent, isFreelancer, isClient);
  const StatusIcon = statusInfo.icon;
  const handleCardClick = () => {
    if (talentId != null && hiredTalentId != null) {
      window.location.href = `/talents/${talentId}/${hiredTalentId}`;
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
        {hiredTalent.payment ? formatEthPrice(BigInt(hiredTalent.payment)) : "Free"}
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

  const deadlineFormatted = hiredTalent.deadline
    ? new Date(Number(hiredTalent.deadline) * 1000).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;

  const deadlineText =
    hiredTalentStatus === HiredTalentState.Ongoing
      ? deadlineFormatted
        ? `Deadline: ${deadlineFormatted}`
        : "Deadline not set"
      : hiredTalentStatus === HiredTalentState.WaitingForApproval
        ? `Client expected duration: ${hiredTalent.hiredTalentDuration} hours`
        : undefined;

  return (
    <>
      <UniversalCard
        bannerUrl={hiredTalent.bannerImageHash}
        avatarAddress={isFreelancer ? hiredTalent.client : hiredTalent.freelancer}
        title={hiredTalent.title || "Untitled HiredTalent"}
        description={hiredTalent.description || "No description provided"}
        extraInfo={deadlineText}
        time={hiredTalent.hiredTalentDuration}
        timeLabel="Client expected duration"
        category={hiredTalent.category}
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

HiredTalentCard.displayName = "HiredTalentCard";

export default HiredTalentCard;
