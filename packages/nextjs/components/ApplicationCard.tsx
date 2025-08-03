import { UniversalJobCard } from "@/components/JobCard/UniversalJobCard";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { ApplicationState } from "~~/types/gig.types";
import { Application } from "~~/types/gig.types";

interface ApplicationProps {
  application: Application;
  className?: string;
}

export default function ApplicationCard({ application, className }: ApplicationProps) {
  const { address: userAddress } = useAccount();
  const applicationStatus = application.state as ApplicationState;

  const isFreelancer = application.freelancer?.toLowerCase() === userAddress?.toLowerCase();

  const getApplicationStatus = () => {
    if (applicationStatus === ApplicationState.Pending) {
      return {
        label: "Waiting for Approval",
        color: "bg-amber-500",
        icon: Clock,
        description: isFreelancer ? "Waiting for client approval" : "Awaiting your approval",
      };
    }

    if (applicationStatus === ApplicationState.Accepted) {
      return {
        label: "Accepted",
        color: "bg-green-500",
        icon: CheckCircle,
        description: "Application accepted by the client",
      };
    }

    if (applicationStatus === ApplicationState.Rejected) {
      return {
        label: "Rejected",
        color: "bg-red-500",
        icon: XCircle,
        description: "Application rejected by the client",
      };
    }

    return {
      label: "Unknown",
      color: "bg-gray-500",
      icon: AlertCircle,
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
    <div className="flex items-center gap-2">
      <div className={cn("h-3 w-3 rounded-full", statusInfo.color)}></div>
      <span className="text-sm font-medium text-content-secondary">{statusInfo.label}</span>
      <StatusIcon className="h-4 w-4 text-content-tertiary" />
    </div>
  );

  const extraInfo = `Proposal: ${application.proposalComment || "No proposal provided"}  |  Duration: ${application.proposedDurationInHours} hours`;

  return (
    <UniversalJobCard
      avatarAddress={application.gig?.client}
      title={application.gig?.title || "Gig Title Not Available"}
      description={application.gig?.description || "Description not available"}
      extraInfo={extraInfo}
      category={application.gig?.category || "Category not available"}
      paymentDisplay={paymentDisplay}
      footerRight={statusDisplay}
      className={className}
    />
  );
}
