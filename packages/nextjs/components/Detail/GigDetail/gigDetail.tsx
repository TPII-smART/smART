"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import UniversalDetail from "../UniversalDetail";
import { ApplicationState, GigState } from "@se-2/common";
import { useQuery, useQueryClient } from "@tanstack/react-query";
//import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { StarIcon } from "@heroicons/react/20/solid";
import {
  ArrowUpTrayIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "~~/components/Badge";
import Button from "~~/components/Button/Button";
import { hiredTalentCategories } from "~~/components/Card/HiredTalentCategory/hiredTalentCategory.data";
//import DisputeFormModal from "~~/components/DisputeForm/DisputeForm";
//import Modal from "~~/components/Modal/Modal";
import { FileFormData } from "~~/components/UploadFileForm/types";
import { useGlobalSpinner } from "~~/context/SpinnerProvider";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
//import { useDisputeContracts } from "~~/hooks/use-dispute-contracts";
import { uploadToIPFS } from "~~/services/IPFS/thirdwebIPFS";
import { fetchGigWithApplicationAndDeliverables } from "~~/services/graphql/fetchers/gig/gig.service";
import { Deliverable } from "~~/types/deliverable";
import { DetailData } from "~~/types/detail/detail.type";
import { Application, Gig } from "~~/types/gig";

type GigData = {
  gig: Gig;
  applications: Application[];
  deliverables: Deliverable[];
};

export default function GigDetail({
  gigId,
  applicationId,
  type,
}: {
  gigId: string;
  applicationId: string;
  type: string;
}) {
  const { address: userAddress } = useAccount();
  const router = useRouter();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  //const [showDisputeModal, setShowDisputeModal] = useState(false);
  //const [showRequestArbitrationModal, setShowRequestArbitrationModal] = useState(false);
  //const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const queryClient = useQueryClient();

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "GigsContract",
  });
  /**
  const { writeContractAsync: writeContractArbiter } = useScaffoldWriteContract({
    contractName: "ArbiterContract",
  });
  */
  const { showSpinner, hideSpinner } = useGlobalSpinner();

  const { data, isLoading, error, refetch } = useQuery<GigData>({
    queryKey: ["gigWithApplicationAndDeliverables", gigId],
    queryFn: async () => {
      const result = await fetchGigWithApplicationAndDeliverables(gigId as string);
      return {
        gig: result.gig,
        applications: result.applications.applications,
        deliverables: result.deliverables,
      };
    },
    enabled: typeof gigId === "string" && !!gigId,
  });

  const application = data?.applications.find(app => String(app.applicationId) === String(applicationId));
  const gigState = data?.gig.state as GigState;
  const applicationState = application?.state as ApplicationState;
  const isClient = data?.gig.client?.toLowerCase() === userAddress?.toLowerCase();
  const freelancer = data?.gig.acceptedFreelancer ? data?.gig.acceptedFreelancer : application?.freelancer;
  const isFreelancer = freelancer?.toLowerCase() === userAddress?.toLowerCase();

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["gigWithApplication", gigId] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
  };
  /** 
  const {
    disputeFinalized,
    isDisputeFinalizedLoading,
    disputeResultData,
    isDisputeResultLoading,
    disputeBeingArbitrated,
    isDisputeArbitrationLoading,
    lastSeenBond,
    arbitrationFee,
  } = useDisputeContracts(data?.gig.disputeQuestionId);

  const disputeLoading = isDisputeFinalizedLoading || isDisputeResultLoading || isDisputeArbitrationLoading;
  const disputeResult =
    disputeResultData && disputeResultData === "0x0000000000000000000000000000000000000000000000000000000000000001";

  const initiateConflictResolution = async () => {};

  const handleFinalizeDispute = async () => {};
  */

  const handleFileUploadToIPFS = async (file: File | undefined) => {
    if (!file) return;

    return await uploadToIPFS(file);
  };

  const handleFreelancerConfirmCompletion = async (fileData: FileFormData) => {
    try {
      showSpinner();
      let resource = "";
      const isLink = fileData.isLink;

      if (!data?.gig.gigId) return;

      if (fileData.file && !isLink) {
        resource = (await handleFileUploadToIPFS(fileData.file)) || "";
      } else if (!fileData.file && isLink) {
        resource = fileData.link || "";
      }

      await writeContract({
        functionName: "confirmFreelancerCompletion",
        args: [BigInt(data?.gig.gigId), { resource, submissionComment: fileData.submissionComment, isLink }],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Confirm gig completion failed:", err);
    } finally {
      hideSpinner();
    }
  };

  const handleClientConfirmCompletion = async (clientResponse?: string) => {
    try {
      showSpinner();
      if (!data?.gig.gigId) return;
      await writeContract({
        functionName: "confirmClientCompletion",
        args: [BigInt(data.gig.gigId), clientResponse],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Confirm gig completion failed:", err);
    } finally {
      hideSpinner();
    }
  };

  const handleCancel = async () => {
    try {
      showSpinner();
      if (!data?.gig.gigId) return;
      await writeContract({
        functionName: "cancelGig",
        args: [BigInt(data.gig.gigId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Cancel gig failed:", err);
    } finally {
      hideSpinner();
    }
  };

  const handleRateGig = async (rating: number) => {
    try {
      showSpinner();
      if (!data?.gig.gigId) return;
      await writeContract({
        functionName: "rateGig",
        args: [BigInt(data.gig.gigId), rating],
      });
      setIsRatingModalOpen(false);
      if (reload) await reload();
    } catch (err) {
      console.error("Rate gig failed:", err);
    } finally {
      hideSpinner();
    }
  };

  const handleRejectGig = async (reason: string) => {
    try {
      showSpinner();
      if (!data?.gig.gigId) return;

      await writeContract({
        functionName: "rejectGig",
        args: [BigInt(data.gig.gigId), reason],
      });

      if (reload) await reload();
    } catch (err) {
      console.error("Reject gig failed:", err);
    } finally {
      setShowDeliverableModal(false);
      hideSpinner();
    }
  };

  const handleAcceptApplication = async () => {
    try {
      showSpinner();
      if (application?.state !== ApplicationState.Pending) return;
      await writeContract({
        functionName: "acceptApplication",
        args: [BigInt(application.gigId), BigInt(application.applicationId)],
        value: BigInt(application.proposedPayment),
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Accept application failed:", err);
    } finally {
      hideSpinner();
    }
  };

  const handleRejectApplication = async () => {
    try {
      showSpinner();
      if (application?.state !== ApplicationState.Pending) return;
      await writeContract({
        functionName: "rejectApplication",
        args: [BigInt(application.gigId), BigInt(application.applicationId), "User rejected the application"],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Reject application failed:", err);
    } finally {
      hideSpinner();
    }
  };

  const handleApplicationWithdraw = async () => {
    try {
      showSpinner();
      if (application?.state !== ApplicationState.Pending) return;
      await writeContract({
        functionName: "withdrawApplication",
        args: [BigInt(application.gigId), BigInt(application.applicationId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Withdraw application failed:", err);
    } finally {
      hideSpinner();
    }
  };

  const handleViewDeliverable = () => {
    router.push(`/gig/${gigId}/deliverables`);
  };

  const getActionButtons = () => {
    const buttons = [];

    if (
      data?.deliverables &&
      data?.deliverables.length > 0 &&
      (isClient || isFreelancer || gigState === GigState.Disputed)
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

    // Freelancer applied actions
    if (isFreelancer && !isFreelancer) {
      if (applicationState === ApplicationState.Pending) {
        buttons.push(
          <Button
            variant="danger"
            key="cancel"
            onClick={handleApplicationWithdraw}
            disabled={isMining}
            size="sm"
            tooltip="Withdraw application"
          >
            <XCircleIcon className="h-5 w-5" />
            Cancel
          </Button>,
        );
      }
    }

    // Freelancer accepted actions
    if (isFreelancer) {
      if (
        gigState === GigState.InProgress &&
        !data?.gig.freelancerCancelled &&
        !data?.gig.clientCancelled &&
        !data?.gig.freelancerDelivered
      ) {
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
      if (gigState !== GigState.Completed && gigState !== GigState.Cancelled && !data?.gig.freelancerCancelled) {
        buttons.push(
          <Button
            variant="danger"
            key="FreelancerCancel"
            onClick={handleCancel}
            disabled={isMining}
            size="sm"
            tooltip="Cancel Gig"
          >
            <XCircleIcon className="h-5 w-5" />
            Cancel
          </Button>,
        );
      }
      /**
      if (gigState === GigState.Disputed) {
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
      */
    }

    // Client actions

    if (isClient) {
      if (applicationState === ApplicationState.Pending) {
        buttons.push(
          <Button
            variant="primary"
            key="approve"
            onClick={handleAcceptApplication}
            disabled={isMining}
            size="sm"
            tooltip="Accept application"
          >
            <CheckCircleIcon className="h-5 w-5" />
            Accept
          </Button>,
        );

        buttons.push(
          <Button
            variant="danger"
            key="Reject application"
            onClick={handleRejectApplication}
            disabled={isMining}
            size="sm"
            tooltip="Cancel Job"
          >
            <XCircleIcon className="h-5 w-5" />
            Reject
          </Button>,
        );
      } else {
        if (gigState === GigState.InProgress) {
          if (data?.gig.freelancerDelivered && !data?.gig.clientReceived) {
            buttons.push(
              <Button
                variant="primary"
                key="receive"
                onClick={() => setShowDeliverableModal(true)}
                disabled={isMining}
                size="sm"
                tooltip="Review"
              >
                <ClipboardDocumentListIcon className="h-5 w-5" />
                Review
              </Button>,
            );
          }
        }

        // Rating button for client when gig is completed

        if (gigState === GigState.Completed) {
          if (!data?.gig.rating) {
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
                Rate Freelancer
              </Button>,
            );
          }
          buttons.push(
            <Button
              variant="primary"
              key="uploadFile"
              onClick={() => setShowReviewModal(true)}
              disabled={isMining}
              size="sm"
              tooltip="Upload File"
            >
              <BookOpenIcon className="h-5 w-5" />
              History
            </Button>,
          );
        }
        if (
          gigState !== GigState.Completed &&
          gigState !== GigState.Cancelled &&
          gigState !== GigState.Disputed &&
          !data?.gig.clientCancelled
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
              Cancel
            </Button>,
          );
        }
        /**
        if (gigState === GigState.Disputed) {
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
        */
      }
    }

    return buttons;
  };

  const getStatusMessage = () => {
    if (data?.gig.state === GigState.Open) {
      if (isClient) {
        return "Please review the proposal and approve it to start the gig.";
      } else if (isFreelancer) {
        return "Waiting for client approval.";
      } else {
        return "Gig is waiting for freelancer approval.";
      }
    }

    if (gigState != undefined && gigState >= GigState.InProgress) {
      return "Gig is in progress.";
    }

    return "";
  };

  const getStatusBadge = (status: number) => {
    const badgeClass = "min-w-[140px] text-center justify-center px-4 py-2";
    switch (status) {
      case GigState.Open:
        return (
          <Badge
            className={`bg-[var(--color-warning)] text-[var(--color-primary-content)] hover:bg-[var(--color-warning)] ${badgeClass}`}
          >
            Waiting for approval
          </Badge>
        );
      case GigState.InProgress:
        return (
          <Badge className={`bg-[var(--color-success)] text-[var(--color-primary-content)] ${badgeClass}`}>
            Ongoing
          </Badge>
        );
      case GigState.Cancelled:
        return <Badge className={`bg-[var(--color-error)] text-white ${badgeClass}`}>Cancelled</Badge>;
      case GigState.Completed:
        return (
          <Badge className={`bg-[var(--color-success)] text-[var(--color-primary-content)] ${badgeClass}`}>
            Completed
          </Badge>
        );
      case GigState.Disputed:
        return <Badge className={`bg-[var(--color-accent)] text-white ${badgeClass}`}>Disputed</Badge>;
      default:
        return null;
    }
  };

  const partialData: DetailData = {
    type: "gig",
    title: data?.gig.title || "",
    proposalComment: application?.proposalComment || "",
    description: data?.gig.description || "",
    client: data?.gig.client,
    freelancer: data?.applications[parseInt(applicationId)]?.freelancer,
    category: data?.gig.category || "",
    payment: data?.applications[parseInt(applicationId)]?.proposedPayment,
    duration: data?.applications[parseInt(applicationId)]?.proposedDurationInHours,
    deadline: data?.gig.deadline || "",
    state: data?.gig.state || 0,
    freelancerDelivered: data?.gig.freelancerDelivered || false,
    clientReceived: data?.gig.clientReceived || false,
    isRejected: data?.gig.clientRejected || false,
    createdAt: data?.gig.createdAt || "",
    acceptedAt: data?.gig.acceptedAt || "",
    canceledAt: data?.gig.canceledAt || "",
    finishedAt: data?.gig.finishedAt || "",
    wasDisputed: !!data?.gig.disputeId,
    //disputeFinalized: disputeFinalized,
    //disputeResult: disputeResult,
    //disputeAppealed: disputeAppealed,
    clientRejected: false,
  };

  const finalDetailData: DetailData = {
    type: "gig",
    title: data?.gig.title || "",
    proposalComment: application?.proposalComment || "",
    description: data?.gig.description || "",
    client: data?.gig.client,
    freelancer: data?.gig.acceptedFreelancer,
    category: hiredTalentCategories.find(category => category.id === data?.gig.category)?.label ?? "Unknown",
    payment: data?.gig.finalPayment || "",
    duration: data?.gig.finalDurationInHours || "",
    deadline: data?.gig.deadline || "",
    state: data?.gig.state || 0,
    freelancerDelivered: data?.gig.freelancerDelivered || false,
    clientReceived: data?.gig.clientReceived || false,
    isRejected: data?.gig.clientRejected || false,
    createdAt: data?.gig.createdAt || "",
    acceptedAt: data?.gig.acceptedAt || "",
    canceledAt: data?.gig.canceledAt || "",
    finishedAt: data?.gig.finishedAt || "",
    rating: data?.gig.rating || 0,
    wasDisputed: !!data?.gig.disputeId,
    //disputeFinalized: disputeFinalized,
    //disputeResult: disputeResult,
    //disputeAppealed: disputeAppealed,
    clientRejected: data?.gig.clientRejected || false,
  };

  return (
    <>
      <UniversalDetail
        data={type === "partial" ? partialData : finalDetailData}
        deliverables={data?.deliverables}
        isMining={isMining}
        loading={isLoading}
        error={error}
        reload={reload}
        statusBadge={getStatusBadge((data?.gig.state as number) || 0)}
        actionButtons={getActionButtons()}
        statusMessage={getStatusMessage()}
        isUploadModalOpen={showUploadModal}
        onCloseUploadModal={() => setShowUploadModal(false)}
        isDeliverableModalOpen={showDeliverableModal}
        onCloseDeliverableModal={() => setShowDeliverableModal(false)}
        isRatingModalOpen={isRatingModalOpen}
        onCloseRatingModal={() => setIsRatingModalOpen(false)}
        isDeliverableLoading={isLoading}
        isPreviewModalOpen={showReviewModal}
        onCloseReviewModal={() => setShowReviewModal(false)}
        handleClientConfirmCompletion={handleClientConfirmCompletion}
        handleRejectJob={handleRejectGig}
        handleRateJob={handleRateGig}
        initiateConflictResolution={() => {}}
        handleFreelancerConfirmCompletion={handleFreelancerConfirmCompletion}
      />
      {/**
      <DisputeFormModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        loading={isSubmittingDispute}
        arbitrationFee={arbitrationFee.data?.toString() || "0"}
        type="gig"
        onSubmit={async () => {
          setIsSubmittingDispute(true);
          try {
            await initiateConflictResolution();
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
      */}
    </>
  );
}
