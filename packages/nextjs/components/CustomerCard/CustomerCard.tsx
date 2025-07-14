import { CustomerProps } from "./types";
import { UniversalJobCard } from "@/components/JobCard/UniversalJobCard";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, Clock, Download, Play, Send, XCircle } from "lucide-react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { JobState } from "~~/types/job.types";

export default function CustomerCard({ job }: CustomerProps) {
  const { address: userAddress } = useAccount();
  const jobStatus = job.state as JobState;

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  const isFreelancer = job.freelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isClient = job.client?.toLowerCase() === userAddress?.toLowerCase();

  // Enhanced status logic considering both parties
  const getJobStatus = () => {
    if (jobStatus === JobState.WaitingForApproval) {
      return {
        label: "Waiting for Approval",
        color: "bg-amber-500",
        icon: Clock,
        description: isFreelancer ? "Waiting for client approval" : "Awaiting your approval",
      };
    }

    if (jobStatus === JobState.Ongoing) {
      // Check delivery status for ongoing jobs
      if (job.freelancerDelivered && job.clientReceived) {
        return {
          label: "Completed - Awaiting Payment",
          color: "bg-blue-500",
          icon: CheckCircle,
          description: "Work delivered and received",
        };
      } else if (job.freelancerDelivered && !job.clientReceived) {
        return {
          label: "Delivered - Awaiting Review",
          color: "bg-purple-500",
          icon: Send,
          description: "Work delivered, awaiting client review",
        };
      } else if (!job.freelancerDelivered && job.clientReceived) {
        return {
          label: "In Progress - Client Ready",
          color: "bg-green-500",
          icon: Play,
          description: "Client ready, awaiting delivery",
        };
      } else {
        return {
          label: "In Progress",
          color: "bg-green-500",
          icon: Play,
          description: "Work in progress",
        };
      }
    }

    if (jobStatus === JobState.Finished) {
      return {
        label: "Completed",
        color: "bg-emerald-500",
        icon: CheckCircle,
        description: "Job successfully completed",
      };
    }

    if (jobStatus === JobState.Cancelled) {
      return {
        label: "Cancelled",
        color: "bg-red-500",
        icon: XCircle,
        description: "Job was cancelled",
      };
    }

    return {
      label: "Unknown",
      color: "bg-gray-500",
      icon: AlertCircle,
      description: "Unknown status",
    };
  };

  const statusInfo = getJobStatus();
  const StatusIcon = statusInfo.icon;

  const handleAccept = async () => {
    try {
      if (job.state !== JobState.WaitingForApproval) return;
      await writeContract({
        functionName: "acceptJob",
        args: [BigInt(job.postingId), BigInt(job.jobId)],
      });
    } catch (err) {
      console.error("Accept job failed:", err);
    }
  };

  const handleCancel = async () => {
    try {
      if (!job.payment || !job.jobId) return;
      await writeContract({
        functionName: "cancelJob",
        args: [BigInt(job.postingId), BigInt(job.jobId)],
      });
    } catch (err) {
      console.error("Cancel job failed:", err);
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      if (!job.jobId) return;
      await writeContract({
        functionName: "confirmCompletion",
        args: [BigInt(job.postingId), BigInt(job.jobId)],
      });
    } catch (err) {
      console.error("Confirm job completion failed:", err);
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

  // Action buttons based on user role and job state
  const getActionButtons = () => {
    const buttons = [];

    // Cancel button - available for both parties until job is finished
    if (jobStatus !== JobState.Finished && jobStatus !== JobState.Cancelled) {
      buttons.push(
        <Button key="cancel" variant="danger" size="sm" onClick={handleCancel} disabled={isMining}>
          <XCircle className="h-4 w-4 mr-1" />
          Cancel
        </Button>,
      );
    }

    // Freelancer actions
    if (isFreelancer) {
      if (jobStatus === JobState.WaitingForApproval) {
        buttons.push(
          <Button key="accept" variant="primary" size="sm" onClick={handleAccept} disabled={isMining}>
            <CheckCircle className="h-4 w-4 mr-1" />
            Accept Job
          </Button>,
        );
      }
      if (jobStatus === JobState.Ongoing && !job.freelancerDelivered) {
        buttons.push(
          <Button key="deliver" variant="primary" size="sm" onClick={handleConfirmCompletion} disabled={isMining}>
            <Send className="h-4 w-4 mr-1" />
            Mark Delivered
          </Button>,
        );
      }
    }

    // Client actions
    if (isClient) {
      if (jobStatus === JobState.Ongoing) {
        if (job.freelancerDelivered && !job.clientReceived) {
          buttons.push(
            <Button key="receive" variant="outline" size="sm" onClick={handleConfirmCompletion} disabled={isMining}>
              <Download className="h-4 w-4 mr-1" />
              Mark Received
            </Button>,
          );
        }
      }
    }

    return buttons;
  };

  const actionButtons = getActionButtons();

  return (
    <UniversalJobCard
      bannerUrl={job.bannerImageUrl}
      avatarAddress={isFreelancer ? job.client : job.freelancer}
      title={job.title || "Untitled Job"}
      description={job.description || "No description provided"}
      category={job.category}
      paymentDisplay={paymentDisplay}
      footerLeft={statusDisplay}
      footerRight={<div className="flex items-center gap-2">{actionButtons}</div>}
      className="hover:shadow-lg transition-shadow duration-200"
    />
  );
}
