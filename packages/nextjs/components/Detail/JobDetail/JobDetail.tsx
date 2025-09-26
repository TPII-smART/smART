import { useState } from "react";
import UniversalDetail from "../UniversalDetail";
import { Badge } from "@/components/Badge";
import Button from "@/components/Button/Button";
import DisputeFormModal, { DisputeFormData } from "@/components/DisputeForm/DisputeForm";
import Spinner from "@/components/Spinner/Spinner";
import { JobState } from "@se-2/common";
import { fetchJob } from "@services/graphql/fetchers/job";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { ScaleIcon, StarIcon, TrophyIcon } from "@heroicons/react/20/solid";
import { ArrowDownTrayIcon, CheckCircleIcon, PaperAirplaneIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { FileFormData } from "~~/components/UploadFileForm/types";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadToIPFS } from "~~/services/IPFS/thirdwebIPFS";
import { fetchDeliverablesForJob } from "~~/services/graphql/fetchers/job/job.service";
import { Deliverable } from "~~/types/deliverable";
import { DetailData } from "~~/types/detail/detail.type";
import { Job } from "~~/types/job";

// or your modal component

export default function JobDetail({ postingId, jobId }: { postingId: string; jobId: string }) {
  const { address: userAddress } = useAccount();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const queryClient = useQueryClient();

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  const { data, isLoading, error, refetch } = useQuery<Job>({
    queryKey: ["jobDetail", jobId],
    queryFn: () => fetchJob(postingId, jobId),
  });

  const { data: disputeFinalized, isLoading: isDisputeFinalizedLoading } = useScaffoldReadContract({
    contractName: "RealityETH",
    functionName: "isFinalized",
    args:
      data?.disputeQuestionId && typeof data.disputeQuestionId === "string" && data.disputeQuestionId.startsWith("0x")
        ? [data.disputeQuestionId as `0x${string}`]
        : ["0x0000000000000000000000000000000000000000000000000000000000000000"],
    watch: !!data?.disputeQuestionId,
  });

  const { data: disputeResultData, isLoading: isDisputeResultLoading } = useScaffoldReadContract({
    contractName: "RealityETH",
    functionName: "resultFor",
    args:
      data?.disputeQuestionId && typeof data.disputeQuestionId === "string" && data.disputeQuestionId.startsWith("0x")
        ? [data.disputeQuestionId as `0x${string}`]
        : ["0x0000000000000000000000000000000000000000000000000000000000000000"],
    watch: !!data?.disputeQuestionId,
  });

  const { data: disputeBeingArbitrated, isLoading: isDisputeArbitrationLoading } = useScaffoldReadContract({
    contractName: "RealityETH",
    functionName: "isPendingArbitration",
    args:
      data?.disputeQuestionId && typeof data.disputeQuestionId === "string" && data.disputeQuestionId.startsWith("0x")
        ? [data.disputeQuestionId as `0x${string}`]
        : ["0x0000000000000000000000000000000000000000000000000000000000000000"],
    watch: !!data?.disputeQuestionId,
  });

  const disputeLoading = isDisputeFinalizedLoading || isDisputeResultLoading || isDisputeArbitrationLoading;

  const disputeResult =
    disputeResultData && disputeResultData === "0x0000000000000000000000000000000000000000000000000000000000000001";

  const arbitrationFee = useScaffoldReadContract({
    contractName: "ArbiterContract",
    functionName: "arbitrationFee",
  });

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

  const requestArbitration = async () => {};

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

  const handleUploadFile = async (fileData: FileFormData) => {
    try {
      let resource = "";
      const isLink = fileData.isLink;

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
      await refetchDeliverables();
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
      await refetchDeliverables();
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

  const handleConfirmCompletion = async (fileData?: FileFormData, clientResponse?: string) => {
    try {
      if (isFreelancer && fileData) {
        await handleUploadFile(fileData);
        await refetch();
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
            <span>Mark as Delivered</span>
          </Button>,
        );
      }
      if (jobStatus === JobState.Disputed && !disputeLoading) {
        if (disputeFinalized) {
          buttons.push(
            <Button
              variant="primary"
              key="finalizeDispute"
              onClick={() => handleFinalizeDispute()}
              disabled={isMining}
              size="sm"
              tooltip="Finalize dispute and release funds"
            >
              <TrophyIcon className="h-5 w-5" />
              <span>Finalize Dispute</span>
            </Button>,
          );
        }
        buttons.push(
          <Button
            variant="outline"
            key="requestArbitration"
            onClick={() => requestArbitration()}
            disabled={isMining}
            size="sm"
            tooltip="Request arbitration from Kleros"
          >
            <ScaleIcon className="h-5 w-5" />
            <span>Request Arbitration</span>
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
              <span>Mark as Received</span>
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
      if (jobStatus === JobState.Disputed && !disputeLoading) {
        if (disputeFinalized) {
          buttons.push(
            <Button
              variant="primary"
              key="finalizeDispute"
              onClick={() => handleFinalizeDispute()}
              disabled={isMining}
              size="sm"
              tooltip="Finalize dispute and release funds"
            >
              <TrophyIcon className="h-5 w-5" />
              <span>Release Funds</span>
            </Button>,
          );
        }
        if (!disputeBeingArbitrated) {
          buttons.push(
            <Button
              variant="outline"
              key="requestArbitration"
              onClick={() => requestArbitration()}
              disabled={isMining}
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
        isUploadModalOpen={showUploadModal}
        onCloseUploadModal={() => setShowUploadModal(false)}
        isDeliverableModalOpen={showDeliverableModal}
        onCloseDeliverableModal={() => setShowDeliverableModal(false)}
        isRatingModalOpen={isRatingModalOpen}
        onCloseRatingModal={() => setIsRatingModalOpen(false)}
        isDeliverableLoading={isDeliverableLoading}
        handleConfirmCompletion={handleConfirmCompletion}
        handleRejectJob={handleRejectJob}
        handleRateJob={handleRateJob}
        initiateConflictResolution={() => setShowDisputeModal(true)}
      />
      <DisputeFormModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        loading={isSubmittingDispute}
        arbitrationFee={arbitrationFee.data?.toString() || "0"}
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
    </>
  );
}
