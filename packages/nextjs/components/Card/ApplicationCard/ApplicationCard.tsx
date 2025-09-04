import { ApplicationProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import { cn } from "@/lib/utils";
import { ApplicationState } from "@se-2/common";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
import Button from "~~/components/Button/Button";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";

export default function ApplicationCard({ application, client, className, reload }: ApplicationProps) {
  const { address: userAddress } = useAccount();
  const applicationStatus = application.state as ApplicationState;

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "GigsContract",
  });

  const isFreelancer = application.freelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isClient = client?.toLowerCase() === userAddress?.toLowerCase();

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

    return {
      label: "Unknown",
      color: "bg-gray-500",
      icon: ExclamationCircleIcon,
      description: "Unknown status",
    };
  };

  const handleAccept = async () => {
    try {
      if (application.state !== ApplicationState.Pending) return;
      await writeContract({
        functionName: "acceptApplication",
        args: [BigInt(application.gigId), BigInt(application.applicationId)],
        value: BigInt(application.proposedPayment),
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Accept application failed:", err);
    }
  };

  const handleReject = async () => {
    try {
      if (application.state !== ApplicationState.Pending) return;
      await writeContract({
        functionName: "rejectApplication",
        // TODO: Add modal for rejection comment
        args: [BigInt(application.gigId), BigInt(application.applicationId), "User rejected the application"],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Reject application failed:", err);
    }
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
    <div className="text-sm text-content-secondary">{application.proposalComment || "No proposal provided"}</div>
  );

  // Action buttons based on user role and gig state
  const getActionButtons = () => {
    const buttons = [];

    if (isClient) {
      if (applicationStatus === ApplicationState.Pending) {
        buttons.push(
          <Button
            variant="danger"
            key="cancel"
            onClick={handleReject}
            disabled={isMining}
            size="sm"
            tooltip="Cancel Job"
          >
            <XCircleIcon className="h-5 w-5" />
          </Button>,
        );
        buttons.push(
          <Button
            variant="primary"
            key="approve"
            onClick={handleAccept}
            disabled={isMining}
            size="sm"
            tooltip="Approve Job"
          >
            <CheckCircleIcon className="h-5 w-5" />
          </Button>,
        );
      }
      if (applicationStatus === ApplicationState.Accepted) {
        buttons.push(
          <Button
            variant="outline"
            key="view"
            onClick={() => {
              window.location.href = `/gig/${application.gigId}`;
            }}
            disabled={isMining}
            size="sm"
            tooltip="Gig Details"
          >
            Gig Details
          </Button>,
        );
      }
    }

    if (isFreelancer) {
      if (applicationStatus === ApplicationState.Accepted) {
        buttons.push(
          <Button
            variant="outline"
            key="view"
            onClick={() => {
              window.location.href = `/gig/${application.gigId}`;
            }}
            disabled={isMining}
            size="sm"
            tooltip="Gig Details"
          >
            Gig Details
          </Button>,
        );
      }
    }

    return buttons;
  };

  const actionButtons = getActionButtons();

  return (
    <UniversalCard
      avatarAddress={application.freelancer}
      title={application.proposalComment || "Gig Title Not Available"}
      description={application.gig?.description || "Description not available"}
      time={application.proposedDurationInHours}
      timeLabel="Proposed Duration"
      extraInfo={extraInfo}
      category={application.gig?.category || "Category not available"}
      paymentDisplay={statusDisplay}
      footerRight={<div className="flex items-center gap-2">{actionButtons}</div>}
      className={className}
      cardVariant="Reduced"
    />
  );
}
