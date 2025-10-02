import { useState } from "react";
import { useDisputeContracts } from "../../../hooks/use-dispute-contracts";
import UniversalDetail from "../UniversalDetail";
import { Badge } from "@/components/Badge";
import Button from "@/components/Button/Button";
import DisputeFormModal, { DisputeFormData } from "@/components/DisputeForm/DisputeForm";
import Spinner from "@/components/Spinner/Spinner";
import { JobState } from "@se-2/common";
import { fetchJob } from "@services/graphql/fetchers/job";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { ScaleIcon, StarIcon, TrophyIcon } from "@heroicons/react/20/solid";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  PaperAirplaneIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import Modal from "~~/components/Modal/Modal";
import { FileFormData } from "~~/components/UploadFileForm/types";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadToIPFS } from "~~/services/IPFS/thirdwebIPFS";
import { fetchDeliverablesForJob } from "~~/services/graphql/fetchers/job/job.service";
import { Deliverable } from "~~/types/deliverable";
import { DetailData } from "~~/types/detail/detail.type";
import { Job } from "~~/types/job";

// or your modal component

export default function JobDetail({ postingId, jobId }: { postingId: string; jobId: string }) {
  const { address: userAddress } = useAccount();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showRequestArbitrationModal, setShowRequestArbitrationModal] = useState(false);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const queryClient = useQueryClient();

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  const { writeContractAsync: writeContractArbiter } = useScaffoldWriteContract({
    contractName: "ArbiterContract",
  });

  const { data, isLoading, error, refetch } = useQuery<Job>({
    queryKey: ["jobDetail", jobId],
    queryFn: () => fetchJob(postingId, jobId),
  });

  const {
    disputeFinalized,
    isDisputeFinalizedLoading,
    disputeResultData,
    isDisputeResultLoading,
    disputeBeingArbitrated,
    isDisputeArbitrationLoading,
    lastSeenBond,
    arbitrationFee,
  } = useDisputeContracts(data?.disputeQuestionId);

  const disputeLoading = isDisputeFinalizedLoading || isDisputeResultLoading || isDisputeArbitrationLoading;
  const disputeResult =
    disputeResultData && disputeResultData === "0x0000000000000000000000000000000000000000000000000000000000000001";

  const initiateConflictResolution = async (values: DisputeFormData) => {
    console.log("Dispute form values:", values);
    await writeContract({
      functionName: "startDispute",
      args: [
        BigInt(postingId),
        BigInt(jobId),
        values.comment,
        parseEther(values.bounty),
        parseEther(values.bond),
        values.arbitration,
      ],
      value:
        parseEther(values.bounty) +
        parseEther(values.bond) +
        (values.arbitration ? BigInt(arbitrationFee.data ?? 0) : BigInt(0)),
    });
  };

  const handleFinalizeDispute = async () => {
    if (!data?.postingId || !data?.jobId) return;
    await writeContract({
      functionName: "resolveDispute",
      args: [BigInt(data.postingId), BigInt(data.jobId)],
    });
    queryClient.invalidateQueries({ queryKey: ["jobDetail", jobId] });
  };

  const requestArbitration = async () => {
    if (!data?.postingId || !data?.jobId || !data?.disputeQuestionId || !lastSeenBond || !arbitrationFee.data) return;
    await writeContractArbiter({
      functionName: "requestArbitration",
      args: [data.disputeQuestionId as `0x${string}`, lastSeenBond],
      value: arbitrationFee.data,
    });
  };

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
        functionName: "uploadDeliverable",
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
      if (data?.disputeQuestionId) {
        return (
          <span>
            A dispute has been initiated for this job. Check the question at{" "}
            <a
              href={`https://reality.eth.limo/app/#!/question/0xb7982f20cc159a40eba4b0ea86fd6cba6ff810e1-${data.disputeQuestionId}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Reality.eth
            </a>
          </span>
        );
      } else {
        return "Got any problems? Initiate a dispute to resolve the issue.";
      }
    }

    return "";
  };

  // Action buttons based on user role and job state
  const getActionButtons = () => {
    const buttons = [];

    // Freelancer actions
    if (isFreelancer) {
      if (
        jobStatus !== JobState.Finished &&
        jobStatus !== JobState.Cancelled &&
        jobStatus !== JobState.Disputed &&
        !job.freelancerCancelled
      ) {
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
      if (jobStatus === JobState.Disputed) {
        if (disputeFinalized) {
          buttons.push(
            <Button
              variant="primary"
              key="finalizeDispute"
              onClick={() => handleFinalizeDispute()}
              disabled={isMining || disputeLoading}
              size="sm"
              tooltip="Finalize dispute and release funds"
            >
              <TrophyIcon className="h-5 w-5" />
              <span>Release Funds</span>
            </Button>,
          );
        } else if (!disputeBeingArbitrated) {
          buttons.push(
            <Button
              variant="outline"
              key="requestArbitration"
              onClick={() => setShowRequestArbitrationModal(true)}
              disabled={isMining || disputeLoading}
              size="sm"
              tooltip="Request arbitration from Kleros"
            >
              <ScaleIcon className="h-5 w-5" />
              <span>Request Arbitration</span>
            </Button>,
          );
        }
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

      if (
        jobStatus !== JobState.Finished &&
        jobStatus !== JobState.Cancelled &&
        jobStatus !== JobState.Disputed &&
        !job.clientCancelled
      ) {
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
      if (jobStatus === JobState.Disputed) {
        if (disputeFinalized) {
          buttons.push(
            <Button
              variant="primary"
              key="finalizeDispute"
              onClick={() => handleFinalizeDispute()}
              disabled={isMining || disputeLoading}
              size="sm"
              tooltip="Finalize dispute and release funds"
            >
              <TrophyIcon className="h-5 w-5" />
              <span>Release Funds</span>
            </Button>,
          );
        } else if (!disputeBeingArbitrated) {
          buttons.push(
            <Button
              variant="outline"
              key="requestArbitration"
              onClick={() => setShowRequestArbitrationModal(true)}
              disabled={isMining || disputeLoading}
              size="sm"
              tooltip="Request arbitration from Kleros"
            >
              <ScaleIcon className="h-5 w-5" />
              <span>Request Arbitration</span>
            </Button>,
          );
        }
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
    wasDisputed: !!data?.disputeQuestionId,
    disputeFinalized: disputeFinalized,
    disputeResult: disputeResult,
    disputeBeingArbitrated: disputeBeingArbitrated,
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
        initiateConflictResolution={() => setShowDisputeModal(true)}
        handleUploadDeliverable={handleUploadDeliverable}
        handleClientConfirmCompletion={handleClientConfirmCompletion}
        handleRejectJob={handleRejectJob}
      />
      <DisputeFormModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        loading={isSubmittingDispute}
        arbitrationFee={arbitrationFee.data?.toString() || "0"}
        type="gig"
        onSubmit={async (values: DisputeFormData) => {
          setIsSubmittingDispute(true);
          try {
            await initiateConflictResolution(values);
            setShowDisputeModal(false);
          } finally {
            setIsSubmittingDispute(false);
          }
        }}
      />
      <Modal
        isOpen={showRequestArbitrationModal}
        onClose={() => setShowRequestArbitrationModal(false)}
        title="Request Arbitration"
      >
        <div className="mb-4">
          <p className="mb-2">
            By requesting arbitration, you will be escalating the dispute to Kleros, a decentralized arbitration
            service. This will allow for a fair review of the case by a panel of jurors. Requesting arbitration will
            incur an additional fee of {formatEther(arbitrationFee.data ?? 0n)} ETH.
          </p>
          <p className="mb-2">Are you sure you want to proceed with requesting arbitration?</p>
          <p className="text-sm text-gray-500">
            Note: Once arbitration is requested, the decision made by the jurors will be final and binding.
          </p>
        </div>
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={async () => {
              await requestArbitration();
              setShowRequestArbitrationModal(false);
            }}
          >
            Confirm
          </Button>
        </div>
      </Modal>
    </>
  );
}
