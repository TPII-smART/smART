"use client";

import * as React from "react";
import { Badge } from "./Badge";
import { castHoursToDurationString, cn } from "@/lib/utils";
import { formatEther } from "viem";
import { CalendarIcon, ClockIcon, StarIcon, UserIcon } from "@heroicons/react/24/outline";
import { Gig } from "~~/types/gig/gig.types";
import { JobPosting } from "~~/types/job/job-posting.types";

interface InfoHeaderProps {
  data: JobPosting | Gig | undefined;
  className?: string;
}

// Type guard to determine if data is a Gig
const isGig = (data: JobPosting | Gig): data is Gig => {
  return "gigId" in data && "client" in data;
};

// Type guard to determine if data is a JobPosting
const isJobPosting = (data: JobPosting | Gig): data is JobPosting => {
  return "postingId" in data && "freelancer" in data;
};

// Component for displaying ETH payment
const PaymentDisplay = ({ amount, label }: { amount?: string; label?: string }) => {
  if (!amount) return null;

  const formatEthPrice = (wei: bigint) => {
    const eth = formatEther(wei);
    const num = parseFloat(eth);
    if (num === 0) return "Free";
    if (num < 0.001) return `${num.toFixed(6)} ETH`;
    if (num < 1) return `${num.toFixed(4)} ETH`;
    return `${num.toFixed(3)} ETH`;
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-[var(--color-secondary-content)]">{label}:</span>}
      <span className="text-lg font-bold text-[var(--color-accent)]">{formatEthPrice(BigInt(amount))}</span>
    </div>
  );
};

// Component for displaying time information
const TimeDisplay = ({ hours, label }: { hours?: string | number; label: string }) => {
  if (!hours) return null;

  return (
    <div className="flex items-center gap-2 text-[var(--color-secondary-content)]">
      <ClockIcon className="h-4 w-4" />
      <span className="text-sm">
        {label}: {castHoursToDurationString(+hours)}
      </span>
    </div>
  );
};

// Component for displaying date information
const DateDisplay = ({ date, label }: { date?: string | number; label: string }) => {
  if (!date) return null;

  const dateFormatted = new Date(Number(date) * 1000).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-2 text-[var(--color-secondary-content)]">
      <CalendarIcon className="h-4 w-4" />
      <span className="text-sm">
        {label}: {dateFormatted}
      </span>
    </div>
  );
};

// Component for displaying rating
const RatingDisplay = ({ rating }: { rating?: number }) => {
  if (rating === undefined || rating === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      <span className="text-sm font-medium text-[var(--color-primary-content)]">{rating.toFixed(1)}</span>
    </div>
  );
};

const InfoHeader: React.FC<InfoHeaderProps> = ({ data, className }) => {
  if (!data) return null;

  return (
    <div
      className={cn(
        "relative w-full min-h-[200px] overflow-hidden rounded-lg border border-[var(--color-border)]",
        "bg-[var(--color-surface)] shadow-lg",
        className,
      )}
    >
      {/* Content overlay */}
      <div className="relative z-10 p-6 h-full flex flex-col justify-between">
        {/* Header section */}
        <div className="space-y-4">
          {/* Type indicator and category */}
          <div className="flex items-center gap-3">
            {isGig(data) ? (
              <span className="text-xs font-semibold text-accent">GIG</span>
            ) : (
              <span className="text-xs font-semibold text-accent">JOB POSTING</span>
            )}
            {data.rating && <RatingDisplay rating={data.rating} />}
          </div>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-primary-content)] leading-tight">
            {data.title}
          </h1>

          {/* Description */}
          {data.description && (
            <p className="text-[var(--color-secondary-content)] text-sm md:text-base leading-relaxed max-w-3xl">
              {data.description}
            </p>
          )}
        </div>

        {/* Info section */}
        <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-4">
          {/* Payment information */}
          {data.basePayment && <PaymentDisplay amount={data.basePayment} label="Base Payment" />}

          {/* Time information */}
          {isGig(data) && data.maxDurationInHours && (
            <TimeDisplay hours={data.maxDurationInHours} label="Estimated Duration" />
          )}
          {isJobPosting(data) && data.averageWorkDuration && (
            <TimeDisplay hours={data.averageWorkDuration} label="Avg Duration" />
          )}

          {/* Date information */}
          {isGig(data) && data.deadline && <DateDisplay date={data.deadline} label="Deadline" />}
          {data.createdAt && <DateDisplay date={data.createdAt} label="Created" />}

          {/* Category badge */}
          {data.category && <Badge>{data.category}</Badge>}

          {/* Creator info */}
          <div className="flex items-center gap-2 text-[var(--color-secondary-content)]">
            <UserIcon className="h-4 w-4" />
            <span className="text-sm">
              {isGig(data) ? "Client" : "Freelancer"}:{" "}
              <span className="font-mono text-xs">{isGig(data) ? `${data.client}` : `${data.freelancer}`}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InfoHeader;
