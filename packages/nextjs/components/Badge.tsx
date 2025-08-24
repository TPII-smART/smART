import React from "react";
import { ActivityItem, ActivityItemStatus } from "~~/types/feed/activityItem.type";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "default" | "secondary";
}

export function Badge({ children, variant = "default", className, ...props }: BadgeProps) {
  const base = "inline-block rounded-full px-3 py-1 text-xs font-semibold";
  const variants = {
    default: "bg-[var(--color-accent)] text-[var(--color-primary-content)]",
    secondary: "bg-[var(--color-secondary)] text-[var(--color-secondary-content)]",
  };
  return (
    <span className={`${base} ${variants[variant]} ${className ?? ""}`} {...props}>
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: ActivityItem["status"] | undefined }) {
  const badgeClass = "min-w-[140px] text-center justify-center";
  switch (status) {
    case ActivityItemStatus.pending:
      return <Badge className={`bg-yellow-100 text-yellow-800 hover:bg-yellow-100 ${badgeClass}`}>Pending</Badge>;
    case ActivityItemStatus.accepted:
      return <Badge className={`bg-[var(--color-success)] text-white ${badgeClass}`}>Accepted</Badge>;
    case ActivityItemStatus.cancelled:
      return <Badge className={`bg-[var(--color-error)] text-white ${badgeClass}`}>Cancelled</Badge>;
    case ActivityItemStatus.completed:
      return <Badge className={`bg-[var(--color-success)] text-white ${badgeClass}`}>Completed</Badge>;
    case ActivityItemStatus.waitingForReview:
      return <Badge className={`bg-purple-500 text-white ${badgeClass}`}>Waiting For Review</Badge>;
    case ActivityItemStatus.rejected:
      return <Badge className={`bg-[var(--color-error)] text-white ${badgeClass}`}>Rejected</Badge>;
    default:
      return null;
  }
}
