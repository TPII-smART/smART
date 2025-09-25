import { useState } from "react";
import UniversalDetail from "../UniversalDetail";
import { Badge } from "@/components/Badge";
import Button from "@/components/Button/Button";
import Spinner from "@/components/Spinner/Spinner";
import { JobState } from "@se-2/common";
import { fetchJob } from "@services/graphql/fetchers/job";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { StarIcon } from "@heroicons/react/20/solid";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  PaperAirplaneIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { FileFormData } from "~~/components/UploadFileForm/types";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadToIPFS } from "~~/services/IPFS/thirdwebIPFS";
import { fetchDeliverablesForJob } from "~~/services/graphql/fetchers/job/job.service";
import { Deliverable } from "~~/types/deliverable";
import { DetailData } from "~~/types/detail/detail.type";
import { Job } from "~~/types/job";

export default function JobDetail({ postingId, jobId }: { postingId: string; jobId: string }) {
  const { address: userAddress } = useAccount();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  const { data, isLoading, error, refetch } = useQuery<Job>({
    queryKey: ["jobDetail", jobId],
    queryFn: () => fetchJob(postingId, jobId),
  });

  const {
    data: deliverables,
    isLoading: isDeliverableLoading,
    refetch: refetchDeliverables,
  } = useQuery<Deliverable[]>({
    queryKey: ["jobDeliverable", postingId, jobId],
    queryFn: async () => {
      const result = await fetchDeliverablesForJob(postingId, jobId);
      return result;
    },
  });
  const job = data as Job;
  const isRejected = job?.clientRejected;
  const isFreelancer = job?.freelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isClient = job?.client?.toLowerCase() === userAddress?.toLowerCase();
  const jobStatus = job?.state as JobState;

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["jobDetail", postingId, jobId] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
  };

  const getStatusBadge = (status: number) => {
    const badgeClass = "min-w-[140px] text-center justify-center px-4 py-2";
    switch (status) {
      case JobState.WaitingForApproval:
        return (
          <Badge
            className={`bg-[var(--color-warning)] text-[var(--color-primary-content)] hover:bg-[var(--color-warning)] ${badgeClass}`}
          >
            Waiting for approval
          </Badge>
        );
      case JobState.Ongoing:
        return (
          <Badge className={`bg-[var(--color-success)] text-[var(--color-primary-content)] ${badgeClass}`}>
            Ongoing
          </Badge>
        );
      case JobState.Cancelled:
        return <Badge className={`bg-[var(--color-error)] text-white ${badgeClass}`}>Cancelled</Badge>;
      case JobState.Finished:
        return (
          <Badge className={`bg-[var(--color-success)] text-[var(--color-primary-content)] ${badgeClass}`}>
            Completed
          </Badge>
        );
      case JobState.Disputed:
        return <Badge className={`bg-[var(--color-accent)] text-white ${badgeClass}`}>Disputed</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-64">
        <Spinner />
      </div>
    );
  }

  const handleAccept = async () => {
    try {
      if (data?.state !== JobState.WaitingForApproval) return;
      if (!data?.payment || !data?.jobId) return;
      await writeContract({
        functionName: "acceptJob",
        args: [BigInt(data?.postingId), BigInt(data?.jobId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Accept job failed:", err);
    }
  };

  const handleCancel = async () => {
    try {
      if (!data?.payment || !data?.jobId) return;
      await writeContract({
        functionName: "cancelJob",
        args: [BigInt(data?.postingId), BigInt(data?.jobId)],
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

  const handleUploadDeliverable = async (deliverableData: FileFormData) => {
    try {
      let resource = "";
      const isLink = deliverableData.isLink;

      if (!job.jobId) return;

      if (deliverableData.file && !isLink) {
        resource = (await handleFileUploadToIPFS(deliverableData.file)) || "";
      } else if (!deliverableData.file && isLink) {
        resource = deliverableData.link || "";
      }

      await writeContract({
        functionName: "uploadFile",
        args: [
          BigInt(job.postingId),
          BigInt(job.jobId),
          { resource, submissionComment: deliverableData.submissionComment, isLink },
        ],
      });
      await refetchDeliverables();
      if (reload) await reload();
    } catch (err) {
      console.error("Upload file failed:", err);
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

  const handleClientConfirmCompletion = async (clientResponse: string) => {
    try {
      await writeContract({
        functionName: "confirmClientCompletion",
        args: [BigInt(job.postingId), BigInt(job.jobId), clientResponse],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Confirm client job completion failed:", err);
    } finally {
      setShowUploadModal(false);
    }
  };

  const handleFreelancerConfirmCompletion = async () => {
    try {
      await writeContract({
        functionName: "confirmFreelancerCompletion",
        args: [BigInt(job.postingId), BigInt(job.jobId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Confirm freelancer job completion failed:", err);
    } finally {
      setShowUploadModal(false);
    }
  };

  const handleRejectJob = async (clientResponse: string) => {
    try {
      if (!job.jobId) return;
      await writeContract({
        functionName: "rejectJob",
        args: [BigInt(job.postingId), BigInt(job.jobId), clientResponse],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Reject deliverable failed:", err);
    } finally {
      setShowDeliverableModal(false);
    }
  };

  // Get status message based on job state and user role
  const getStatusMessage = () => {
    if (data?.state === JobState.WaitingForApproval) {
      if (isClient) {
        return "Waiting for freelancer to accept the job. You can cancel if needed.";
      } else if (isFreelancer) {
        return "Please review the job details and accept to start working.";
      } else {
        return "Job is waiting for freelancer approval.";
      }
    }

    if (data?.state != undefined && data?.state >= JobState.Ongoing) {
      return "¿Facing any problems with this job?";
    }

    return "";
  };

  // Action buttons based on user role and job state
  const getActionButtons = () => {
    const buttons = [];

    // Freelancer actions
    if (isFreelancer) {
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
            <span>Accept</span>
          </Button>,
        );
      }
      if (
        jobStatus === JobState.Ongoing &&
        !job.freelancerDelivered &&
        !job.freelancerCancelled &&
        !job.clientCancelled
      ) {
        if (isRejected && !job.freelancerUploaded)
          buttons.push(
            <Button
              variant="primary"
              key="review"
              onClick={() => {
                setShowReviewModal(true);
              }}
              disabled={isMining}
              size="sm"
              tooltip="Review Deliverable"
            >
              <ClipboardDocumentListIcon className="h-5 w-5" />
              <span>Review</span>
            </Button>,
          );

        if (job.freelancerUploaded) {
          buttons.push(
            <Button
              variant="primary"
              key="deliver"
              onClick={() => handleFreelancerConfirmCompletion()}
              disabled={isMining}
              size="sm"
              tooltip="Deliver"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              <span>Mark as Delivered</span>
            </Button>,
          );
        } else {
          buttons.push(
            <Button
              variant="primary"
              key="upload"
              onClick={() => setShowUploadModal(true)}
              disabled={isMining}
              size="sm"
              tooltip="Upload"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              <span>Upload</span>
            </Button>,
          );
        }
      }
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
            <span>Cancel</span>
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
              <ClipboardDocumentListIcon className="h-5 w-5" />
              <span>Review</span>
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
            <span>Rate Freelancer</span>
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
            <span>Cancel</span>
          </Button>,
        );
      }
    }

    return buttons;
  };

  const detailData: DetailData = {
    type: "job",
    title: data?.title || "",
    description: data?.description || "",
    client: data?.client,
    freelancer: data?.freelancer,
    category: data?.category || "",
    payment: data?.payment || "",
    duration: data?.jobDuration || "",
    deadline: data?.deadline,
    state: data?.state || 0,
    freelancerDelivered: data?.freelancerDelivered || false,
    clientReceived: data?.clientReceived || false,
    isRejected: isRejected || false,
    createdAt: data?.createdAt || "",
    acceptedAt: data?.acceptedAt || "",
    canceledAt: data?.canceledAt || "",
    finishedAt: data?.finishedAt || "",
    rating: data?.rating || 0,
    clientRejected: data?.clientRejected || false,
  };

  return (
    <>
      <UniversalDetail
        data={detailData}
        deliverables={deliverables}
        isMining={isMining}
        loading={isLoading}
        error={error}
        reload={reload}
        statusBadge={getStatusBadge((data?.state as number) || 0)}
        actionButtons={getActionButtons()}
        statusMessage={getStatusMessage()}
        isDeliverableLoading={isDeliverableLoading}
        isDeliverableModalOpen={showDeliverableModal}
        isRatingModalOpen={isRatingModalOpen}
        isUploadModalOpen={showUploadModal}
        isPreviewModalOpen={showReviewModal}
        onCloseUploadModal={() => {
          setShowUploadModal(false);
        }}
        onClosePreviewModal={() => setShowReviewModal(false)}
        onCloseRatingModal={() => setIsRatingModalOpen(false)}
        onCloseDeliverableModal={() => setShowDeliverableModal(false)}
        handleRateJob={handleRateJob}
        handleUploadDeliverable={handleUploadDeliverable}
        handleClientConfirmCompletion={handleClientConfirmCompletion}
        handleRejectJob={handleRejectJob}
      />
    </>
  );
}
