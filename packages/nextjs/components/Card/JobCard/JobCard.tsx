import { useState } from "react";
import Button from "../../Button/Button";
import type { JobCardProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import { cn } from "@/lib/utils";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  PaperAirplaneIcon,
  PlayIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import DeliverableReviewModal from "~~/components/DeliverableReviewModal/DeliverableReviewModal";
import UploadFileForm from "~~/components/UploadFileForm/UploadFileForm";
import { FileFormData } from "~~/components/UploadFileForm/types";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadToIPFS } from "~~/services/IPFS/thirdwebIPFS";
import { JobStateEnum } from "~~/types/job/job.types";

export default function JobCard({ job, reload, className }: JobCardProps) {
  const { address: userAddress } = useAccount();
  const jobStatus = job.state as JobStateEnum;
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  const isFreelancer = job.freelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isClient = job.client?.toLowerCase() === userAddress?.toLowerCase();

  const getJobStatus = () => {
    if (jobStatus === JobStateEnum.WaitingForApproval) {
      return {
        label: "Waiting for Approval",
        color: "bg-amber-500",
        icon: ClockIcon,
        description: isFreelancer ? "Waiting for client approval" : "Awaiting your approval",
      };
    }

    if (jobStatus === JobStateEnum.Ongoing) {
      // Check delivery status for ongoing jobs
      if (job.freelancerDelivered && job.clientReceived) {
        return {
          label: "Completed - Awaiting Payment",
          color: "bg-blue-500",
          icon: CheckCircleIcon,
          description: "Work delivered and received",
        };
      } else if (job.freelancerDelivered && !job.clientReceived) {
        return {
          label: "Delivered - Awaiting Review",
          color: "bg-purple-500",
          icon: PaperAirplaneIcon,
          description: "Work delivered, awaiting client review",
        };
      } else if (!job.freelancerDelivered && job.clientReceived) {
        return {
          label: "In Progress - Client Ready",
          color: "bg-green-500",
          icon: PlayIcon,
          description: "Client ready, awaiting delivery",
        };
      } else {
        return {
          label: "In Progress",
          color: "bg-green-500",
          icon: PlayIcon,
          description: "Work in progress",
        };
      }
    }

    if (jobStatus === JobStateEnum.Finished) {
      return {
        label: "Completed",
        color: "bg-emerald-500",
        icon: CheckCircleIcon,
        description: "Job successfully completed",
      };
    }

    if (jobStatus === JobStateEnum.Cancelled) {
      return {
        label: "Cancelled",
        color: "bg-red-500",
        icon: XCircleIcon,
        description: "Job was cancelled",
      };
    }

    return {
      label: "Unknown",
      color: "bg-gray-500",
      icon: ExclamationTriangleIcon,
      description: "Unknown status",
    };
  };

  const statusInfo = getJobStatus();
  const StatusIcon = statusInfo.icon;

  const handleAccept = async () => {
    try {
      if (job.state !== JobStateEnum.WaitingForApproval) return;
      await writeContract({
        functionName: "acceptJob",
        args: [BigInt(job.postingId), BigInt(job.jobId)],
      });
      if (reload) await reload();
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
      if (reload) await reload();
    } catch (err) {
      console.error("Cancel job failed:", err);
    }
  };

  const handleFileUploadToIPFS = async (file: File | undefined) => {
    if (!file) return;

    return await uploadToIPFS(file);
  };

  const handleConfirmCompletion = async (fileData?: FileFormData, clientResponse?: string) => {
    try {
      if (isFreelancer && fileData) {
        await handleUploadFile(fileData);
      }

      if (isClient && clientResponse) {
        console.log("Entre");
        console.log("Client response:", clientResponse);
        await handleWriteComment(clientResponse);
      }

      await writeContract({
        functionName: "confirmCompletion",
        args: [BigInt(job.postingId), BigInt(job.jobId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Confirm job completion failed:", err);
    } finally {
      setShowUploadModal(false);
    }
  };

  const handleUploadFile = async (fileData: FileFormData) => {
    try {
      let resource = "";
      const isLink = fileData.isLink;
      console.log("entre");

      if (!job.jobId) return;

      if (fileData.file && !isLink) {
        resource = (await handleFileUploadToIPFS(fileData.file)) || "";
        console.log("File uploaded to IPFS:", resource);
      } else if (!fileData.file && isLink) {
        resource = fileData.link || "";
      }

      await writeContract({
        functionName: "uploadFile",
        args: [
          BigInt(job.postingId),
          BigInt(job.jobId),
          { resource, submissionComment: fileData.submissionComment, isLink },
        ],
      });
    } catch (err) {
      console.error("Upload file failed:", err);
    }
  };

  const handleWriteComment = async (comment: string) => {
    try {
      await writeContract({
        functionName: "addCommentToJob",
        args: [BigInt(job.postingId), BigInt(job.jobId), comment],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Write comment failed:", err);
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
    jobStatus === JobStateEnum.Ongoing
      ? deadlineFormatted
        ? `Deadline: ${deadlineFormatted}`
        : "Deadline not set"
      : jobStatus === JobStateEnum.WaitingForApproval
        ? `Client expected duration: ${job.jobDuration} hours`
        : undefined;

  // Action buttons based on user role and job state
  const getActionButtons = () => {
    const buttons = [];

    // Cancel button - available for both parties until job is finished
    if (jobStatus !== JobStateEnum.Finished && jobStatus !== JobStateEnum.Cancelled) {
      buttons.push(
        <Button variant="danger" key="cancel" onClick={handleCancel} disabled={isMining} size="sm" tooltip="Cancel Job">
          <XCircleIcon className="h-5 w-5" />
        </Button>,
      );
    }

    // Freelancer actions
    if (isFreelancer) {
      if (jobStatus === JobStateEnum.WaitingForApproval) {
        buttons.push(
          <Button
            variant="primary"
            key="accept"
            onClick={handleAccept}
            disabled={isMining}
            size="sm"
            tooltip="Accept Job"
          >
            <CheckCircleIcon className="h-5 w-5" />
          </Button>,
        );
      }
      if (jobStatus === JobStateEnum.Ongoing && !job.freelancerDelivered) {
        buttons.push(
          <Button
            variant="primary"
            key="deliver"
            onClick={() => setShowUploadModal(true)}
            disabled={isMining}
            size="sm"
            tooltip="Mark as Delivered"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </Button>,
        );
      }
    }

    // Client actions
    if (isClient) {
      if (jobStatus === JobStateEnum.Ongoing) {
        if (job.freelancerDelivered && !job.clientReceived) {
          buttons.push(
            <Button
              variant="primary"
              key="receive"
              onClick={() => setShowDeliverableModal(true)}
              disabled={isMining}
              size="sm"
              tooltip="Mark as Received"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
            </Button>,
          );
        }
      }
    }

    return buttons;
  };

  const actionButtons = getActionButtons();

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
        footerRight={<div className="flex items-center gap-2">{actionButtons}</div>}
        className={className}
        cardVariant="Reduced"
      />
      {/* Confirm Modal */}
      <UploadFileForm
        onSubmit={handleConfirmCompletion}
        loading={isMining}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        modalTitle="Submit Deliverable"
        modalDescription={`You are about to submit your deliverable for this job.\nPlease upload the required file or paste a link, and optionally add a comment for the client.\nPayment will be released once the client confirms receipt.`}
      />

      {console.log("job.resource", job.resource, job.isLink)}

      <DeliverableReviewModal
        isOpen={showDeliverableModal}
        onApprove={() => handleConfirmCompletion(undefined)}
        onReject={() => handleConfirmCompletion(undefined)}
        onClose={() => setShowDeliverableModal(false)}
        modalTitle="Deliverable Review"
        modalDescription="Please review the deliverable and provide your feedback."
        resource={job.resource}
        isLink={job.isLink}
        freelancerComment={job.submissionComment}
      />
    </>
  );
}
