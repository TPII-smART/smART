"use client";

import Link from "next/link";
import { Badge } from "@/components/Badge";
import Button from "@/components/Button/index";
import { Card } from "@/components/Card";
import { Dispute } from "types/dispute/dispute.type";
import { ArrowRightIcon, ClockIcon, ExclamationTriangleIcon, UsersIcon } from "@heroicons/react/24/outline";

interface DisputeCardProps {
  dispute: Dispute;
}

export function DisputeCard({ dispute }: DisputeCardProps) {
  // Convertir fondos de string a number (asumiendo wei)
  const freelancerAmount = dispute.freelancerFunds;
  const clientAmount = dispute.clientFunds;

  const totalAmount = freelancerAmount + clientAmount;

  // Calcular porcentajes
  const clientTotalAmountToPay = dispute.currentRound === 0 ? 0 : dispute.clientFee;
  const freelancerTotalAmountToPay = dispute.currentRound === 0 ? 0 : dispute.freelancerFee;

  console.log("currentRound", dispute.currentRound);
  console.log("appealCost", dispute.appealCost);
  console.log("freelancerTotalAmountToPay", freelancerTotalAmountToPay);
  console.log("clientTotalAmountToPay", clientTotalAmountToPay);

  const freelancerPercentage = clientTotalAmountToPay > 0 ? (freelancerAmount / freelancerTotalAmountToPay) * 100 : 0;
  const clientPercentage = clientTotalAmountToPay > 0 ? (clientAmount / clientTotalAmountToPay) * 100 : 0;

  const deadline = new Date(dispute.disputeDeadline);
  const now = new Date();
  const hoursRemaining = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
  const daysRemaining = Math.floor(hoursRemaining / 24);

  // Mapeo de status
  const getStatusInfo = () => {
    if (dispute.disputeFinished) return { text: "Resolved", color: "bg-muted text-muted-foreground" };
    if (hoursRemaining < 24) return { text: "Urgent", color: "bg-destructive/10 text-destructive" };
    return { text: "Active", color: "bg-secondary text-destructive" };
  };

  const statusInfo = getStatusInfo();

  const getDeadlineColor = () => {
    if (hoursRemaining < 24) return "text-destructive";
    if (hoursRemaining < 72) return "text-orange-500";
    return "text-muted-foreground";
  };

  const formatEth = (value: number) => {
    return (value / 1e18).toFixed(4);
  };

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

        {/* Amount and Contributions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Total Staked</span>
            <span className="text-lg font-bold text-foreground">{formatEth(totalAmount)} ETH</span>
          </div>

          {/* Contribution Bars */}
          <div className="space-y-2">
            {/* Freelancer */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Freelancer</span>
                <span className="text-xs font-semibold text-foreground">
                  {formatEth(freelancerAmount)} ETH ({freelancerPercentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full transition-all bg-blue-500" style={{ width: `${freelancerPercentage}%` }} />
              </div>
            </div>

            {/* Client */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Client</span>
                <span className="text-xs font-semibold text-foreground">
                  {formatEth(clientAmount)} ETH ({clientPercentage.toFixed(0)}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full transition-all bg-purple-500" style={{ width: `${clientPercentage}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Appeal Cost */}
        {dispute.appealCost > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
            <span className="text-sm font-medium text-foreground">Appeal Cost</span>
            <span className="text-sm font-semibold">{formatEth(dispute.appealCost)} ETH</span>
          </div>
        )}

        {/* Deadline */}
        <div className={`flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 ${getDeadlineColor()}`}>
          <ClockIcon className="h-4 w-4" />
          <div className="flex-1">
            <div className="text-xs font-medium">
              {daysRemaining > 0
                ? `${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} remaining`
                : hoursRemaining > 0
                  ? `${hoursRemaining} hour${hoursRemaining !== 1 ? "s" : ""} remaining`
                  : "Deadline passed"}
            </div>
            <div className="text-xs text-muted-foreground">
              {deadline.toLocaleDateString()} at{" "}
              {deadline.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t items-center border-border bg-card/50 px-6 py-3">
        <div className="flex justify-center">
          <Link href={`/disputes/${dispute.disputeId}`}>
            <Button variant="outline" className="h-8 px-3 text-sm gap-2 bg-transparent">
              View Details
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
