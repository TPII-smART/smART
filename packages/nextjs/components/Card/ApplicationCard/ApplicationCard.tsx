import { ApplicationProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import { cn } from "@/lib/utils";
import { ApplicationState } from "@se-2/common";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  BackspaceIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";

export default function ApplicationCard({ application, className, highlight, variant }: ApplicationProps) {
  const { address: userAddress } = useAccount();
  const applicationStatus = application.state as ApplicationState;

  const isFreelancer = application.freelancer?.toLowerCase() === userAddress?.toLowerCase();

  const getApplicationStatus = () => {
    if (applicationStatus === ApplicationState.Pending) {
      return {
        label: "Waiting for Approval",
        color: "bg-amber-500",
        icon: ClockIcon,
        description: isFreelancer ? "Waiting for client approval" : "Awaiting your approval",
      };
    }

    if (applicationStatus === ApplicationState.Accepted) {
      return {
        label: "Accepted",
        color: "bg-green-500",
        icon: CheckCircleIcon,
        description: "Application accepted by the client",
      };
    }

    if (applicationStatus === ApplicationState.Rejected) {
      return {
        label: "Rejected",
        color: "bg-red-500",
        icon: XCircleIcon,
        description: "Application rejected by the client",
      };
    }

    if (applicationStatus === ApplicationState.Withdrawn) {
      return {
        label: "Withdrawn",
        color: "bg-gray-200",
        icon: BackspaceIcon,
        description: "Application withdrawn by the freelancer",
      };
    }

    return {
      label: "Unknown",
      color: "bg-gray-500",
      icon: ExclamationCircleIcon,
      description: "Unknown status",
    };
  };

  const statusInfo = getApplicationStatus();
  const StatusIcon = statusInfo.icon;

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
        {application.proposedPayment ? formatEthPrice(BigInt(application.proposedPayment)) : "Free"}
      </span>
    </div>
  );

  // Status display for footer left
  const statusDisplay = (
    <div className="flex flex-col justify-between">
      {paymentDisplay}
      <div className="flex items-center gap-2 mt-2">
        <div className={cn("h-3 w-3 rounded-full", statusInfo.color)}></div>
        <span className="text-sm font-medium text-content-secondary">{statusInfo.label}</span>
        <StatusIcon className="h-4 w-4 text-content-tertiary" />
      </div>
    </div>
  );

  const extraInfo = (
    <div
      className="
        w-full
        bg-black/10
        rounded-xl
        px-4
        py-3
        flex flex-col
        shadow-lg
        "
      style={{
        backdropFilter: "blur(6px)",
        border: "1px solid var(--color-border)",
      }}
    >
      <span className="text-xs font-semibold text-content-primary mb-0.5">Proposal</span>
      <span className="text-sm text-content-secondary break-words">
        {application.proposalComment || "No proposal provided"}
      </span>
    </div>
  );

  const handleCardClick = () => {
    if (applicationStatus === ApplicationState.Pending) {
      window.location.href = `/gig/${application?.gigId}/${application?.applicationId}`;
    } else {
      window.location.href = `/gig/${application?.gigId}`;
    }
  };

  return (
    <UniversalCard
      avatarAddress={(variant || "profile") === "gig" ? application.freelancer : application.gig?.client || undefined}
      title={
        (variant || "profile") === "gig"
          ? application.proposalComment || "No proposal provided"
          : application.gig?.title || "Title not available"
      }
      description={application.gig?.description || "Description not available"}
      time={application.proposedDurationInHours}
      timeLabel="Proposed Duration"
      extraInfo={extraInfo}
      category={application.gig?.category || "Category not available"}
      paymentDisplay={statusDisplay}
      className={className}
      cardVariant={(variant || "profile") === "gig" ? "Reduced" : "Partial"}
      highlight={highlight}
      onClick={handleCardClick}
    />
  );
}
