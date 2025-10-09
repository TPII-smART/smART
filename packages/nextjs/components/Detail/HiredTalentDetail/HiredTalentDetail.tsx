import { useState } from "react";
import { useRouter } from "next/navigation";
import UniversalDetail from "../UniversalDetail";
import { Badge } from "@/components/Badge";
import Button from "@/components/Button/Button";
import Spinner from "@/components/Spinner/Spinner";
import { HiredTalentState } from "@se-2/common";
import { fetchHiredTalent } from "@services/graphql/fetchers/hiredTalent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { StarIcon } from "@heroicons/react/20/solid";
import { ArrowUpTrayIcon, CheckCircleIcon, ClipboardDocumentListIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { hiredTalentCategories } from "~~/components/Card/HiredTalentCategory/hiredTalentCategory.data";
import { FileFormData } from "~~/components/UploadFileForm/types";
import { useGlobalSpinner } from "~~/context/SpinnerProvider";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadToIPFS } from "~~/services/IPFS/thirdwebIPFS";
import { fetchDeliverablesForHiredTalent } from "~~/services/graphql/fetchers/hiredTalent/hiredTalent.service";
import { Deliverable } from "~~/types/deliverable";
import { DetailData } from "~~/types/detail/detail.type";
import { HiredTalent } from "~~/types/hiredTalent";

export default function HiredTalentDetail({ talentId, hiredTalentId }: { talentId: string; hiredTalentId: string }) {
  const { address: userAddress } = useAccount();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const router = useRouter();

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "HiredTalentsContract",
  });
  const { showSpinner, hideSpinner } = useGlobalSpinner();

  const { data, isLoading, error, refetch } = useQuery<HiredTalent>({
    queryKey: ["hiredTalentDetail", hiredTalentId],
    queryFn: () => fetchHiredTalent(talentId, hiredTalentId),
  });

  const {
    data: deliverables,
    isLoading: isDeliverableLoading,
    refetch: refetchDeliverables,
  } = useQuery<Deliverable[]>({
    queryKey: ["hiredTalentDeliverable", talentId, hiredTalentId],
    queryFn: async () => {
      const result = await fetchDeliverablesForHiredTalent(talentId, hiredTalentId);
      return result;
    },
  });
  const hiredTalent = data as HiredTalent;
  const isRejected = hiredTalent?.clientRejected;
  const isFreelancer = hiredTalent?.freelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isClient = hiredTalent?.client?.toLowerCase() === userAddress?.toLowerCase();
  const hiredTalentStatus = hiredTalent?.state as HiredTalentState;

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["hiredTalentDetail", talentId, hiredTalentId] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
    await refetchDeliverables();
  };

  const getStatusBadge = (status: number) => {
    const badgeClass = "min-w-[140px] text-center justify-center px-4 py-2";
    switch (status) {
      case HiredTalentState.WaitingForApproval:
        return (
          <Badge
            className={`bg-[var(--color-warning)] text-[var(--color-primary-content)] hover:bg-[var(--color-warning)] ${badgeClass}`}
          >
            Waiting for approval
          </Badge>
        );
      case HiredTalentState.Ongoing:
        return (
          <Badge className={`bg-[var(--color-success)] text-[var(--color-primary-content)] ${badgeClass}`}>
            Ongoing
          </Badge>
        );
      case HiredTalentState.Cancelled:
        return <Badge className={`bg-[var(--color-error)] text-white ${badgeClass}`}>Cancelled</Badge>;
      case HiredTalentState.Finished:
        return (
          <Badge className={`bg-[var(--color-success)] text-[var(--color-primary-content)] ${badgeClass}`}>
            Completed
          </Badge>
        );
      case HiredTalentState.Disputed:
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
      showSpinner();
      if (data?.state !== HiredTalentState.WaitingForApproval) return;
      if (!data?.payment || !data?.hiredTalentId) return;
      await writeContract({
        functionName: "acceptHiredTalent",
        args: [BigInt(data?.talentId), BigInt(data?.hiredTalentId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Accept hire failed:", err);
    } finally {
      hideSpinner();
    }
  };

  const handleCancel = async () => {
    try {
      showSpinner();
      if (!data?.payment || !data?.hiredTalentId) return;
      await writeContract({
        functionName: "cancelHiredTalent",
        args: [BigInt(data?.talentId), BigInt(data?.hiredTalentId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Cancel hire failed:", err);
    } finally {
      hideSpinner();
    }
  };

  const handleFileUploadToIPFS = async (file: File | undefined) => {
    if (!file) return;

    return await uploadToIPFS(file);
  };

  const handleRateHiredTalent = async (rating: number) => {
    try {
      showSpinner();
      if (!hiredTalent.hiredTalentId) return;
      await writeContract({
        functionName: "rateHiredTalent",
        args: [BigInt(hiredTalent.talentId), BigInt(hiredTalent.hiredTalentId), rating],
      });
      setIsRatingModalOpen(false);
      if (reload) await reload();
    } catch (err) {
      console.error("Rate hire failed:", err);
    } finally {
      hideSpinner();
    }
  };

  const handleClientConfirmCompletion = async (clientResponse: string) => {
    try {
      showSpinner();
      await writeContract({
        functionName: "confirmClientCompletion",
        args: [BigInt(hiredTalent.talentId), BigInt(hiredTalent.hiredTalentId), clientResponse],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Confirm client hire completion failed:", err);
    } finally {
      setShowUploadModal(false);
      hideSpinner();
    }
  };

  const handleFreelancerConfirmCompletion = async (deliverableData: FileFormData) => {
    try {
      let resource = "";
      const isLink = deliverableData.isLink;

      showSpinner();

      if (deliverableData.file && !isLink) {
        resource = (await handleFileUploadToIPFS(deliverableData.file)) || "";
      } else if (!deliverableData.file && isLink) {
        resource = deliverableData.link || "";
      }

      await writeContract({
        functionName: "confirmFreelancerCompletion",
        args: [
          BigInt(hiredTalent.talentId),
          BigInt(hiredTalent.hiredTalentId),
          { resource, submissionComment: deliverableData.submissionComment, isLink },
        ],
      });
      if (reload) await reload();
      await refetchDeliverables();
    } catch (err) {
      console.error("Confirm freelancer hire completion failed:", err);
    } finally {
      setShowUploadModal(false);
      hideSpinner();
    }
  };

  const handleRejectHiredTalent = async (clientResponse: string) => {
    try {
      showSpinner();
      if (!hiredTalent.hiredTalentId) return;
      await writeContract({
        functionName: "rejectHiredTalent",
        args: [BigInt(hiredTalent.talentId), BigInt(hiredTalent.hiredTalentId), clientResponse],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Reject deliverable failed:", err);
    } finally {
      setShowDeliverableModal(false);
      hideSpinner();
    }
  };

  // Get status message based on hiredTalent state and user role
  const getStatusMessage = () => {
    if (data?.state === HiredTalentState.WaitingForApproval) {
      if (isClient) {
        return "Waiting for freelancer to accept the hire. You can cancel if needed.";
      } else if (isFreelancer) {
        return "Please review the hire details and accept to start working.";
      } else {
        return "Hire is waiting for freelancer approval.";
      }
    }

    if (data?.state != undefined && data?.state >= HiredTalentState.Ongoing) {
      return "¿Facing any problems with this hire?";
    }

    return "";
  };

  const handleViewDeliverable = () => {
    router.push(`/talents/${hiredTalentId}/${talentId}/deliverables`);
  };

  // Action buttons based on user role and job state
  const getActionButtons = () => {
    const buttons = [];

    if (
      deliverables &&
      deliverables.length > 0 &&
      (isClient || isFreelancer || hiredTalentStatus === HiredTalentState.Disputed)
    ) {
      buttons.push(
        <Button
          variant="outline"
          key="viewDeliverables"
          onClick={handleViewDeliverable}
          disabled={isMining}
          size="sm"
          tooltip="View Deliverables"
        >
          <ClipboardDocumentListIcon className="h-5 w-5" />
          <span>View Deliverables</span>
        </Button>,
      );
    }
    // Freelancer actions
    if (isFreelancer) {
      if (hiredTalentStatus === HiredTalentState.WaitingForApproval) {
        buttons.push(
          <Button
            variant="primary"
            key="accept"
            onClick={handleAccept}
            disabled={isMining}
            size="sm"
            tooltip="Accept HiredTalent"
          >
            <CheckCircleIcon className="h-5 w-5" />
            <span>Accept</span>
          </Button>,
        );
      }
      if (
        hiredTalentStatus === HiredTalentState.Ongoing &&
        !hiredTalent.freelancerDelivered &&
        !hiredTalent.freelancerCancelled &&
        !hiredTalent.clientCancelled
      ) {
        buttons.push(
          <Button
            variant="primary"
            key="deliver"
            onClick={() => setShowUploadModal(true)}
            disabled={isMining}
            size="sm"
            tooltip="Deliver"
          >
            <ArrowUpTrayIcon className="h-5 w-5" />
            <span>Upload</span>
          </Button>,
        );
      }
      if (
        hiredTalentStatus !== HiredTalentState.Finished &&
        hiredTalentStatus !== HiredTalentState.Cancelled &&
        !hiredTalent.freelancerCancelled
      ) {
        buttons.push(
          <Button
            variant="danger"
            key="FreelancerCancel"
            onClick={handleCancel}
            disabled={isMining}
            size="sm"
            tooltip="Cancel HiredTalent"
          >
            <XCircleIcon className="h-5 w-5" />
            <span>Cancel</span>
          </Button>,
        );
      }
    }

    // Client actions
    if (isClient) {
      if (hiredTalentStatus === HiredTalentState.Ongoing) {
        if (hiredTalent.freelancerDelivered && !hiredTalent.clientReceived) {
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

      if (hiredTalentStatus === HiredTalentState.Finished && !hiredTalent.rating) {
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
        hiredTalentStatus !== HiredTalentState.Finished &&
        hiredTalentStatus !== HiredTalentState.Cancelled &&
        !hiredTalent.clientCancelled
      ) {
        buttons.push(
          <Button
            variant="danger"
            key="ClientCancel"
            onClick={handleCancel}
            disabled={isMining}
            size="sm"
            tooltip="Cancel HiredTalent"
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
    type: "hiredTalent",
    title: data?.title || "",
    description: data?.description || "",
    client: data?.client,
    freelancer: data?.freelancer,
    category: hiredTalentCategories.find(category => category.id === data?.category)?.label ?? "Unknown",
    payment: data?.payment || "",
    duration: data?.hiredTalentDuration || "",
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
        onCloseReviewModal={() => setShowReviewModal(false)}
        onCloseRatingModal={() => setIsRatingModalOpen(false)}
        onCloseDeliverableModal={() => setShowDeliverableModal(false)}
        handleRateJob={handleRateHiredTalent}
        handleFreelancerConfirmCompletion={handleFreelancerConfirmCompletion}
        handleClientConfirmCompletion={handleClientConfirmCompletion}
        handleRejectJob={handleRejectHiredTalent}
      />
    </>
  );
}
