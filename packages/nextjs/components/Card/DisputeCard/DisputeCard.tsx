"use client";

import Link from "next/link";
import { Badge } from "@/components/Badge";
import Button from "@/components/Button/index";
import { Card } from "@/components/Card";
import {
  ArrowRightIcon,
  BanknotesIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { formatDate, getDetailedTimeUntilDeadline, getTimeUntilDeadline } from "~~/lib/utils";
import { Dispute } from "~~/types/dispute/dispute.type";

interface DisputeCardProps {
  dispute: Dispute;
}

export function DisputeCard({ dispute }: DisputeCardProps) {
  const freelancerAmount = dispute.freelancerFunds;
  const clientAmount = dispute.clientFunds;
  const totalClientAmount = dispute.clientFee ? dispute.clientFee : 0;
  const totalFreelancerAmount = dispute.freelancerFee ? dispute.freelancerFee : 0;

  const freelancerPercentage = totalFreelancerAmount > 0 ? (freelancerAmount / totalFreelancerAmount) * 100 : 0;
  const clientPercentage = totalClientAmount > 0 ? (clientAmount / totalClientAmount) * 100 : 0;

  const deadlineFormat = formatDate(dispute.roundDeadline);
  const timeUntilDeadline = getTimeUntilDeadline(dispute.roundDeadline);
  const timeDetails = getDetailedTimeUntilDeadline(dispute.roundDeadline);
  const hasFunding = totalClientAmount > 0 || totalFreelancerAmount > 0;
  const isDeadlinePassed = timeDetails.isExpired;

  const getStatusInfo = () => {
    if (dispute.disputeFinished) return { text: "Resolved", color: "bg-muted text-muted-foreground" };
    if (timeDetails.hours < 24) return { text: "Urgent", color: "bg-destructive/10 text-destructive" };
    return { text: "Active", color: "bg-secondary text-desctructive" };
  };

  const statusInfo = getStatusInfo();

  const getDeadlineColor = () => {
    if (timeDetails.hours < 24) return "text-destructive";
    if (timeDetails.hours < 72) return "text-orange-500";
    return "text-muted-foreground";
  };

  const formatEth = (value: number) => {
    return (value / 1e18).toFixed(4);
  };

  const formatPct = (p: number) => `${Math.max(0, Math.min(100, p)).toFixed(1)}%`;

  const totalParticipants = dispute.contributors.length;

  return (
    <Card className="flex flex-col transition-all hover:shadow-lg">
      {/* Header */}
      <div className="border-b border-border bg-card/50 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="line-clamp-2 text-lg font-semibold text-foreground">{dispute.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{dispute.description}</p>
          </div>
          <Badge className={statusInfo.color}>{statusInfo.text}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-4 px-6 py-4">
        {/* Dispute Reason */}
        <div className="flex items-start gap-2 rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2">
          <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-xs font-medium text-orange-600 dark:text-orange-400 block mb-1">Dispute Reason</span>
            <p className="text-xs text-foreground line-clamp-2">{dispute.disputeReason}</p>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2">
          <UsersIcon className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground">
              {totalParticipants} {totalParticipants === 1 ? "contributor" : "contributors"}
            </span>
          </div>
        </div>

        {/* Round Info */}
        <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
          <span className="text-sm font-medium text-foreground">Round</span>
          <span className="text-sm font-semibold">{dispute.currentRound}</span>
        </div>

        {/* Funding Status */}
        {!hasFunding ? (
          <div className="flex items-start gap-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 px-3 py-2.5">
            <BanknotesIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300 mb-1">No Funding Yet</p>
              <p className="text-xs text-muted-foreground">
                Visit the detail page to fund your appeal and contribute to the dispute resolution.
              </p>
            </div>
          </div>
        ) : (
          /* Amount and Contributions */
          <div className="space-y-3">
            {/* Total Staked */}
            <div className="flex items-center justify-between border-tpt-2 border-border">
              <span className="text-sm font-medium text-foreground">Total Client Staked</span>
              <span className="text-lg font-bold text-foreground">{formatEth(totalClientAmount)} ETH</span>
            </div>
            <div className="flex items-center justify-between  ">
              <span className="text-sm font-medium text-foreground">Total Freelancer Staked</span>
              <span className="text-lg font-bold text-foreground">{formatEth(totalFreelancerAmount)} ETH</span>
            </div>
            {/* Freelancer Stake */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Freelancer Stake</span>
                <span className="text-sm font-bold text-foreground">
                  {formatEth(freelancerAmount)} ETH{" "}
                  {<span className="text-xs text-muted-foreground">({formatPct(freelancerPercentage)})</span>}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full transition-all bg-blue-500" style={{ width: `${freelancerPercentage}%` }} />
              </div>
              {freelancerAmount === 0 && <p className="text-xs text-muted-foreground italic">Not funded yet</p>}
            </div>
            {/* Client Stake */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Client Stake</span>
                <span className="text-sm font-bold text-foreground">
                  {formatEth(clientAmount)} ETH{" "}
                  {<span className="text-xs text-muted-foreground">({formatPct(clientPercentage)})</span>}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full transition-all bg-purple-500" style={{ width: `${clientPercentage}%` }} />
              </div>
              {clientAmount === 0 && <p className="text-xs text-muted-foreground italic">Not funded yet</p>}
            </div>
          </div>
        )}

        {/* Deadline */}
        {hasFunding && (
          <div className={`flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 ${getDeadlineColor()}`}>
            <ClockIcon className="h-4 w-4" />
            <div className="flex-1">
              <div className="text-xs font-medium">{timeUntilDeadline} remaining </div>
              <div className="text-xs text-muted-foreground">{deadlineFormat}</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t items-center border-border bg-card/50 px-6 py-3">
        <div className="flex justify-center">
          <Link href={`/talents/${dispute.disputeId}`}>
            <Button variant="outline" className="h-8 px-3 text-sm gap-2 bg-transparent">
              {hasFunding ? "View Details" : "Fund Appeal"}
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
