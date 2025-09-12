import { useState } from "react";
import Button from "../../Button/Button";
import type { JobCardProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import RatingStars from "@/components/RatingStars";
import { cn } from "@/lib/utils";
import { JobState } from "@se-2/common";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import * as Yup from "yup";
import { StarIcon } from "@heroicons/react/20/solid";
import { ArrowDownTrayIcon, CheckCircleIcon, PaperAirplaneIcon, XCircleIcon } from "@heroicons/react/24/outline";
import DeliverableReviewModal from "~~/components/DeliverableReviewModal/DeliverableReviewModal";
import FormModal from "~~/components/Modal/FormModal/FormModal";
import UploadFileForm from "~~/components/UploadFileForm/UploadFileForm";
import { FileFormData } from "~~/components/UploadFileForm/types";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadToIPFS } from "~~/services/IPFS/thirdwebIPFS";
import { getJobStatus } from "~~/utils/scaffold-eth/Status/getStatus";

export default function JobCard({ job, reload, className, highlight }: JobCardProps) {
  const { address: userAddress } = useAccount();
  const jobStatus = job.state as JobState;
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  const isFreelancer = job.freelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isClient = job.client?.toLowerCase() === userAddress?.toLowerCase();
  const isRejected = job.clientRejected;

  const statusInfo = getJobStatus(jobStatus, job, isFreelancer, isClient);
  const StatusIcon = statusInfo.icon;

  const handleAccept = async () => {
    try {
      if (job.state !== JobState.WaitingForApproval) return;
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

  const handleRejectJob = async (reason: string) => {
    try {
      if (!job.jobId) return;
      await writeContract({
        functionName: "rejectJob",
        args: [BigInt(job.postingId), BigInt(job.jobId)],
      });
      if (reload) await reload();

      await handleAddComment(reason);
    } catch (err) {
      console.error("Reject deliverable failed:", err);
    } finally {
      setShowDeliverableModal(false);
    }
  };

  const handleConfirmCompletion = async (fileData?: FileFormData, clientResponse?: string) => {
    try {
      if (isFreelancer && fileData) {
        await handleUploadFile(fileData);
      }

      if (isClient && clientResponse) {
        await handleAddComment(clientResponse);
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

  const handleAddComment = async (comment: string) => {
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

  const handleRateJob = async (rating: number) => {
    try {
      if (!job.jobId) return;
      await writeContract({
        functionName: "rateJob",
        args: [BigInt(job.postingId), BigInt(job.jobId), rating],
      });
      setIsRatingModalOpen(false);
      if (reload) await reload();
    } catch (err) {
      console.error("Rate job failed:", err);
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
    jobStatus === JobState.Ongoing
      ? deadlineFormatted
        ? `Deadline: ${deadlineFormatted}`
        : "Deadline not set"
      : jobStatus === JobState.WaitingForApproval
        ? `Client expected duration: ${job.jobDuration} hours`
        : undefined;

  // Action buttons based on user role and job state
  const getActionButtons = () => {
    const buttons = [];

    // Freelancer actions
    if (isFreelancer) {
      if (jobStatus !== JobState.Finished && jobStatus !== JobState.Cancelled && !job.freelancerCancelled) {
        buttons.push(
          <Button
            variant="danger"
            key="FreelancerCancel"
            onClick={handleCancel}
            disabled={isMining}
            size="sm"
            tooltip="Cancel Job"
          >
            <XCircleIcon className="h-5 w-5" />
          </Button>,
        );
      }
      if (jobStatus === JobState.WaitingForApproval) {
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
      if (
        jobStatus === JobState.Ongoing &&
        !job.freelancerDelivered &&
        !job.freelancerCancelled &&
        !job.clientCancelled
      ) {
        buttons.push(
          <Button
            variant="primary"
            key="deliver"
            onClick={() => (isRejected ? setShowDeliverableModal(true) : setShowUploadModal(true))}
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
      if (jobStatus === JobState.Ongoing) {
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

      if (jobStatus === JobState.Finished && !job.rating) {
        buttons.push(
          <Button
            variant="primary"
            key="rate"
            onClick={() => setIsRatingModalOpen(true)}
            disabled={isMining}
            size="sm"
            tooltip="Rate Freelancer"
          >
            <StarIcon className="h-5 w-5" />
          </Button>,
        );
      }

      if (jobStatus !== JobState.Finished && jobStatus !== JobState.Cancelled && !job.clientCancelled) {
        buttons.push(
          <Button
            variant="danger"
            key="ClientCancel"
            onClick={handleCancel}
            disabled={isMining}
            size="sm"
            tooltip="Cancel Job"
          >
            <XCircleIcon className="h-5 w-5" />
          </Button>,
        );
      }
    }

    return buttons;
  };

  const actionButtons = getActionButtons();

  const validationSchema = Yup.object().shape({
    rating: Yup.number()
      .required("Please select a rating")
      .min(1, "Please select a rating")
      .max(5, "Rating must be between 1 and 5"),
  });

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
        highlight={highlight}
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
        onApprove={handleConfirmCompletion}
        onReject={reason => handleRejectJob(reason)}
        onClose={() => setShowDeliverableModal(false)}
        modalTitle="Deliverable Review"
        modalDescription="Please review the deliverable and provide your feedback."
        resource={job.resource}
        isLink={job.isLink}
        comment={isClient ? job.submissionComment : job.clientResponse}
        canUploadFile={isFreelancer && isRejected}
        loading={isMining}
      />

      {/* Rating modal for client */}
      <FormModal
        modalProps={{
          title: "Rate Freelancer's Work",
          onClose: () => setIsRatingModalOpen(false),
          isOpen: isRatingModalOpen,
          loading: isMining,
        }}
        formikProps={{
          onSubmit: values => handleRateJob(values.rating),
          initialValues: { rating: 0 },
          validationSchema,
        }}
      >
        {formikProps => (
          <RatingStars
            name="rating"
            value={formikProps.values.rating}
            onChange={value => formikProps.setFieldValue("rating", value)}
          />
        )}
      </FormModal>
    </>
  );
}
