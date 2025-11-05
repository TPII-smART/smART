"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DisputeStatus, Ruling, useDisputeContracts } from "../../../hooks/use-dispute-contracts";
import UniversalDetail from "../UniversalDetail";
import AppealFormModal, { AppealFormData } from "@/components/DisputeForm/AppealForm";
import DisputeFormModal, { DisputeFormData } from "@/components/DisputeForm/DisputeForm";
import { ApplicationState, GigState } from "@se-2/common";
import { fetchDisputeById } from "@services/graphql/fetchers/dispute";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { ScaleIcon, StarIcon, TrophyIcon } from "@heroicons/react/20/solid";
import { ArrowUpTrayIcon, CheckCircleIcon, ClipboardDocumentListIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { Badge } from "~~/components/Badge";
import Button from "~~/components/Button/Button";
import { hiredTalentCategories } from "~~/components/Card/HiredTalentCategory/hiredTalentCategory.data";
import Modal from "~~/components/Modal/Modal";
import { FileFormData } from "~~/components/UploadFileForm/types";
import { useGlobalSpinner } from "~~/context/SpinnerProvider";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadToIPFS } from "~~/services/IPFS/pinataIPFS";
import { fetchGigWithApplicationAndDeliverables } from "~~/services/graphql/fetchers/gig/gig.service";
import { Deliverable } from "~~/types/deliverable";
import { DetailData } from "~~/types/detail/detail.type";
import { Dispute } from "~~/types/dispute/dispute.type";
import { Application, Gig } from "~~/types/gig";
import { createInitialEvidencePDF } from "~~/utils/kleros-disputes/createInitialEvidencePDF";
import { createAndUploadEvidence, createEvidenceJSON } from "~~/utils/kleros-disputes/getEvidenceJSON";
import { getMetaEvidenceURI } from "~~/utils/kleros-disputes/getMetaEvidenceJSON";

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

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showPayFeeModal, setShowPayFeeModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  const [fundingSide, setFundingSide] = useState<"client" | "freelancer">("client");
  const router = useRouter();

  const queryClient = useQueryClient();

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "GigsContract",
  });
  const { showSpinner, hideSpinner } = useGlobalSpinner();

  const {
    data,
    isLoading: isDetailLoading,
    error,
    refetch,
  } = useQuery<GigData>({
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

  const {
    data: disputeData,
    isLoading: isDisputeLoading,
    refetch: refetchDispute,
  } = useQuery<Dispute>({
    queryKey: ["disputeDetail", data?.gig?.disputeId],
    queryFn: () => fetchDisputeById(data?.gig?.disputeId || 0),
  });

  const isLoading = isDetailLoading || isDisputeLoading;
  const application = data?.applications.find(app => String(app.applicationId) === String(applicationId));
  const gigState = data?.gig.state as GigState;
  const applicationState = application?.state as ApplicationState;
  const isClient = data?.gig.client?.toLowerCase() === userAddress?.toLowerCase();
  const freelancer = data?.gig.acceptedFreelancer ? data?.gig.acceptedFreelancer : application?.freelancer;
  const isFreelancer = freelancer?.toLowerCase() === userAddress?.toLowerCase();
  const disputeDetail = disputeData ? disputeData : null;

  const {
    disputeCurrentRuling,
    isDisputeCurrentRulingLoading,
    disputeStatus,
    isDisputeStatusLoading,
    arbitrationCost,
    freelancerFee,
    isFreelancerFeeLoading,
    clientFee,
    isClientFeeLoading,
    appealDeadline,
  } = useDisputeContracts(data?.gig?.disputeId);

  const reload = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ["gigWithApplicationAndDeliverables", gigId] });
    queryClient.invalidateQueries({ queryKey: ["disputeDetail", data?.gig?.disputeId] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
    await refetchDispute();
  }, [data?.gig?.disputeId, gigId, queryClient, refetch, refetchDispute]);

  useEffect(() => {
    reload();
  }, [disputeStatus, disputeCurrentRuling, reload]);

  const disputeLoading =
    isDisputeCurrentRulingLoading || isDisputeStatusLoading || isFreelancerFeeLoading || isClientFeeLoading;

  const initiateConflictResolution = async (values: DisputeFormData) => {
    if (!data?.gig?.gigId) return;
    if (data?.gig?.disputeId) return;
    showSpinner();
    try {
      const metaDataURI = getMetaEvidenceURI();

      await writeContract({
        functionName: "startDispute",
        args: [BigInt(data?.gig?.gigId), metaDataURI, values.comment],
        value: BigInt(arbitrationCost || 0),
      });

      // Upload the Initial Evidence PDF as part of the dispute creation process
      const initialEvidenceFile = await createInitialEvidencePDF(
        new Date().toISOString().split("T")[0],
        isFreelancer ? "Freelancer" : "Client",
        `
        Client address: ${data?.gig.client}\n
        Freelancer selected among the candidates: ${data?.gig.acceptedFreelancer}\n
        Job Title: ${data?.gig.title}\n
        Job Description: ${data?.gig.description || ""}\n
        Payment amount declared: ${formatEther(BigInt(data?.gig.finalPayment || data?.gig.basePayment || 0))} ETH\n`,
        values.comment,
      );

      const evidenceJSON = await createAndUploadEvidence(
        initialEvidenceFile,
        "Initial Evidence",
        "All the information regarding the job present in the platform.",
      );

      await writeContract({
        functionName: "submitEvidence",
        args: [BigInt(data?.gig.gigId), evidenceJSON],
      });

      reload();
    } catch (error) {
      console.error("Error initiating conflict resolution:", error);
    } finally {
      hideSpinner();
      setShowDisputeModal(false);
    }
  };

  const payArbitrationFee = async () => {
    if (!data?.gig?.disputeId || !data?.gig?.gigId) return;
    if (data?.gig?.disputeId === 0) return;
    if (!freelancerFee || !clientFee) return;
    const feeToUse = isFreelancer ? freelancerFee : clientFee;
    showSpinner();
    try {
      await writeContract({
        functionName: "payArbitrationFee",
        args: [BigInt(data?.gig?.gigId)],
        value: BigInt(feeToUse || 0),
      });
      reload();
    } catch (error) {
      console.error("Error paying arbitration fee:", error);
    } finally {
      hideSpinner();
      setShowPayFeeModal(false);
    }
  };

  const concedeDispute = async () => {
    if (!data?.gig?.disputeId || !data?.gig?.gigId) return;
    if (data?.gig?.disputeId === 0) return;
    showSpinner();
    try {
      await writeContract({
        functionName: "concedeDispute",
        args: [BigInt(data?.gig?.gigId)],
      });
      reload();
    } catch (error) {
      console.error("Error conceding dispute:", error);
    } finally {
      hideSpinner();
      setShowPayFeeModal(false);
    }
  };

  console.log(data?.gig);
  console.log(disputeDetail);

  const handleFinalizeDispute = async () => {
    if (!data?.gig?.disputeId || !data?.gig?.gigId) return;
    if (data?.gig?.disputeId === 0) return;
    if (disputeStatus !== DisputeStatus.Solved) return;
    showSpinner();
    try {
      await writeContract({
        functionName: "finalizeDispute",
        args: [BigInt(data?.gig?.gigId)],
      });
      reload();
    } catch (error) {
      console.error("Error finalizing dispute:", error);
    } finally {
      hideSpinner();
    }
  };

  const handleFundAppeal = async (values: AppealFormData, side: "client" | "freelancer") => {
    if (!data?.gig?.disputeId || !data?.gig?.gigId) return;
    if (data?.gig?.disputeId === 0) return;
    if (disputeStatus !== DisputeStatus.Appealable) return;
    if (!freelancerFee || !clientFee) return;
    showSpinner();
    try {
      await writeContract({
        functionName: "fundAppeal",
        args: [BigInt(data?.gig?.gigId), side === "client" ? Ruling.ClientWins : Ruling.FreelancerWins],
        value: parseEther(values.funds.toString()),
      });
      reload();
    } catch (error) {
      console.error("Error funding appeal:", error);
    } finally {
      hideSpinner();
    }
  };

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
        args: [
          BigInt(data?.gig.gigId),
          {
            resource,
            parsedResource: isLink
              ? ""
              : await createEvidenceJSON(resource, fileData.file?.name || "", "Deliverable submission by Freelancer"),
            submissionComment: fileData.submissionComment,
            isLink,
          },
        ],
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

  const isWaiting = disputeStatus === DisputeStatus.Waiting;
  const currentDeadline = (disputeDetail?.currentRound || 0) == 0 ? disputeDetail?.roundDeadline : appealDeadline;
  const expiredRound =
    (!disputeDetail?.freelancerPaidArbitrationFee || !disputeDetail?.clientPaidArbitrationFee) &&
    disputeDetail?.roundDeadline &&
    new Date() > new Date(Number(currentDeadline) * 1000);

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
      if (
        gigState !== GigState.Completed &&
        gigState !== GigState.Cancelled &&
        gigState !== GigState.Disputed &&
        !data?.gig.freelancerCancelled
      ) {
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
      if (gigState === GigState.Disputed) {
        if (
          !isWaiting &&
          (expiredRound ||
            (disputeDetail?.raiseOnKleros && disputeStatus === DisputeStatus.Solved && !disputeDetail?.disputeFinished))
        ) {
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
        } else if (!disputeDetail?.freelancerPaidArbitrationFee && (disputeDetail?.currentRound || 0) == 0) {
          buttons.push(
            <Button
              variant="outline"
              key="payArbitrationFee"
              onClick={() => setShowPayFeeModal(true)}
              disabled={isMining || disputeLoading}
              size="sm"
              tooltip="Dispute Actions"
            >
              <ScaleIcon className="h-5 w-5" />
              <span>Dispute Actions</span>
            </Button>,
          );
        }
      }
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
        if (gigState === GigState.Disputed) {
          if (
            !isWaiting &&
            (expiredRound ||
              (disputeDetail?.raiseOnKleros &&
                disputeStatus === DisputeStatus.Solved &&
                !disputeDetail?.disputeFinished))
          ) {
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
          } else if (!disputeDetail?.clientPaidArbitrationFee && (disputeDetail?.currentRound || 0) == 0) {
            buttons.push(
              <Button
                variant="outline"
                key="payArbitrationFee"
                onClick={() => setShowPayFeeModal(true)}
                disabled={isMining || disputeLoading}
                size="sm"
                tooltip="Dispute Actions"
              >
                <ScaleIcon className="h-5 w-5" />
                <span>Dispute Actions</span>
              </Button>,
            );
          }
        }
      }
    }

    if (gigState === GigState.Disputed && disputeStatus === DisputeStatus.Appealable) {
      if (
        disputeDetail?.freelancerFunds !== undefined &&
        Number(disputeDetail.freelancerFunds) < (freelancerFee ?? 0) &&
        !isClient
      ) {
        buttons.push(
          <Button
            variant="outline"
            key="appealFreelancer"
            onClick={() => {
              setFundingSide("freelancer");
              setShowAppealModal(true);
            }}
            disabled={isMining || disputeLoading}
            size="sm"
            tooltip="Fund appeal dispute"
          >
            <ScaleIcon className="h-5 w-5" />
            <span>Fund Freelancer Appeal</span>
          </Button>,
        );
      }
      if (
        disputeDetail?.clientFunds !== undefined &&
        Number(disputeDetail.clientFunds) < (clientFee ?? 0) &&
        !isFreelancer
      ) {
        buttons.push(
          <Button
            variant="outline"
            key="appealClient"
            onClick={() => {
              setFundingSide("client");
              setShowAppealModal(true);
            }}
            disabled={isMining || disputeLoading}
            size="sm"
            tooltip="Fund appeal dispute"
          >
            <ScaleIcon className="h-5 w-5" />
            <span>Fund Client Appeal</span>
          </Button>,
        );
      }
    }

    return buttons;
  };

  // Get status message based on hiredTalent state and user role
  const getStatusMessage = () => {
    if (data?.gig?.state === GigState.Open) {
      if (isClient) {
        return "Please review the proposal and approve it to start the gig.";
      } else if (isFreelancer) {
        return "Waiting for client approval.";
      } else {
        return "Gig is waiting for freelancer approval.";
      }
    }

    const freelancerAmount = Number(disputeDetail?.freelancerFunds || 0);
    const clientAmount = Number(disputeDetail?.clientFunds || 0);
    const totalFreelancerAmount = Number(freelancerFee || 1);
    const totalClientAmount = Number(clientFee || 1);

    const freelancerPercentage = totalFreelancerAmount > 0 ? (freelancerAmount / totalFreelancerAmount) * 100 : 0;
    const clientPercentage = totalClientAmount > 0 ? (clientAmount / totalClientAmount) * 100 : 0;

    const formatPct = (p: number) => `${Math.max(0, Math.min(100, p)).toFixed(1)}%`;

    if (data?.gig?.state != undefined && data?.gig?.state >= GigState.InProgress) {
      if (data?.gig?.disputeId && data?.gig?.disputeId > 0) {
        if (disputeDetail?.disputeFinished) return null;
        return (
          <div>
            {data?.gig?.disputeId && data?.gig?.disputeId > 0 ? (
              <>
                {(!disputeDetail?.freelancerPaidArbitrationFee || !disputeDetail?.clientPaidArbitrationFee) &&
                  (disputeDetail?.currentRound || 0) == 0 && (
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <CheckCircleIcon
                          className={`h-6 w-6 ${disputeDetail?.freelancerPaidArbitrationFee ? "text-green-500" : "text-gray-400"}`}
                        />
                        <span className="ml-2">Freelancer Paid Fee</span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircleIcon
                          className={`h-6 w-6 ${disputeDetail?.clientPaidArbitrationFee ? "text-green-500" : "text-gray-400"}`}
                        />
                        <span className="ml-2">Client Paid Fee</span>
                      </div>
                    </div>
                  )}

                {disputeDetail?.raiseOnKleros &&
                  disputeStatus === DisputeStatus.Appealable &&
                  (Number(disputeDetail?.clientFunds ?? 0) > 0 || Number(disputeDetail?.freelancerFunds ?? 0) > 0 ? (
                    <div className="space-y-3">
                      {/* Freelancer Stake */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Freelancer Stake</span>
                          <span className="text-sm font-bold text-foreground">
                            {`${formatEther(BigInt(freelancerAmount))} / ${formatEther(BigInt(totalFreelancerAmount))}`}{" "}
                            ETH{" "}
                            <span className="text-xs text-muted-foreground">({formatPct(freelancerPercentage)})</span>
                          </span>
                        </div>
                        <div className="relative h-4 w-full rounded-full bg-muted border border-gray-600 overflow-hidden">
                          {" "}
                          <div className="absolute inset-0 bg-transparent h-full transition-all" />
                          <div
                            className="absolute inset-0 bg-blue-500 h-full transition-all"
                            style={{ width: `${freelancerPercentage}%` }}
                          />
                        </div>
                      </div>

                      {/* Client Stake */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">Client Stake</span>
                          <span className="text-sm font-bold text-foreground">
                            {`${formatEther(BigInt(clientAmount))} / ${formatEther(BigInt(totalClientAmount))}`} ETH{" "}
                            <span className="text-xs text-muted-foreground">({formatPct(clientPercentage)})</span>
                          </span>
                        </div>
                        <div className="relative h-4 w-full rounded-full bg-muted border border-gray-600 overflow-hidden">
                          {" "}
                          <div className="absolute inset-0 bg-transparent h-full transition-all" />
                          <div
                            className="absolute inset-0 bg-blue-500 h-full transition-all"
                            style={{ width: `${clientPercentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p>Dispute is appealable. Fund your side to appeal the ruling.</p>
                  ))}

                {(((!disputeDetail?.freelancerPaidArbitrationFee || !disputeDetail?.clientPaidArbitrationFee) &&
                  (disputeDetail?.currentRound || 0) == 0) ||
                  (disputeStatus === DisputeStatus.Appealable && disputeDetail?.raiseOnKleros)) && (
                  <div>
                    <p className="text-sm text-gray-500">
                      Deadline to{" "}
                      {disputeDetail?.clientPaidArbitrationFee && disputeDetail?.freelancerPaidArbitrationFee
                        ? "appeal"
                        : "pay fee"}
                      :{" "}
                      <span className="font-medium text-gray-700">
                        {disputeStatus === DisputeStatus.Appealable && appealDeadline
                          ? new Date(Number(appealDeadline) * 1000).toLocaleString()
                          : disputeDetail?.roundDeadline
                            ? new Date(Number(disputeDetail?.roundDeadline) * 1000).toLocaleString()
                            : "N/A"}
                      </span>
                    </p>
                  </div>
                )}

                {disputeStatus === DisputeStatus.Waiting && (
                  <p>Waiting for the Kleros jurors to rule on the dispute.</p>
                )}

                {disputeCurrentRuling !== undefined &&
                  BigInt(disputeCurrentRuling) !== 0n &&
                  disputeDetail?.raiseOnKleros &&
                  disputeStatus !== DisputeStatus.Waiting && (
                    <div>
                      <p className="text-sm text-gray-500">
                        Current Ruling:{" "}
                        <span className="font-medium text-gray-700">
                          {BigInt(disputeCurrentRuling) === BigInt(Ruling.ClientWins)
                            ? "Client Wins"
                            : "Freelancer Wins"}
                        </span>
                        {BigInt(disputeDetail?.freelancerFunds || 0) >= BigInt(freelancerFee || 0) &&
                          BigInt(disputeDetail?.clientFunds || 0) < BigInt(clientFee || 0) && (
                            <span> - Freelancer fully funded appeal</span>
                          )}
                        {BigInt(disputeDetail?.clientFunds || 0) >= BigInt(clientFee || 0) &&
                          BigInt(disputeDetail?.freelancerFunds || 0) < BigInt(freelancerFee || 0) && (
                            <span> - Client fully funded appeal</span>
                          )}
                      </p>
                    </div>
                  )}
              </>
            ) : (
              <p>Got any problems? Initiate a dispute to resolve the issue.</p>
            )}
          </div>
        );
      } else {
        return "Got any problems? Initiate a dispute to resolve the issue.";
      }
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
    rating: data?.gig?.rating || 0,
    wasDisputed: !!data?.gig?.disputeId,
    disputeFinalized: disputeDetail?.disputeFinished || false,
    disputeResult: disputeCurrentRuling !== undefined && BigInt(disputeCurrentRuling) === BigInt(Ruling.FreelancerWins),
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
    disputeFinalized: disputeDetail?.disputeFinished || false,
    disputeResult: disputeCurrentRuling !== undefined && BigInt(disputeCurrentRuling) === BigInt(Ruling.FreelancerWins),
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
        initiateConflictResolution={() => setShowDisputeModal(true)}
        handleFreelancerConfirmCompletion={handleFreelancerConfirmCompletion}
      />
      <DisputeFormModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        loading={isSubmittingDispute}
        arbitrationFee={arbitrationCost ? String(arbitrationCost) : "0"}
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
      <AppealFormModal
        isOpen={showAppealModal}
        onClose={() => setShowAppealModal(false)}
        loading={isSubmittingDispute}
        side={fundingSide}
        requiredFee={fundingSide === "freelancer" ? freelancerFee : clientFee}
        currentTotal={
          fundingSide === "freelancer" ? disputeDetail?.freelancerFunds || 0 : disputeDetail?.clientFunds || 0
        }
        type="gig"
        onSubmit={async (values: AppealFormData) => {
          setIsSubmittingDispute(true);
          try {
            await handleFundAppeal(values, fundingSide);
            setShowAppealModal(false);
          } finally {
            setIsSubmittingDispute(false);
          }
        }}
      />
      <Modal isOpen={showPayFeeModal} onClose={() => setShowPayFeeModal(false)} title="A dispute has been raised">
        <div className="mb-4">
          <p className="mb-2">
            The other party has initiated a dispute. You can either match the arbitration fee to continue the dispute
            process or concede the dispute to the other party. If you choose to pay the arbitration fee, the case will
            be reviewed by jurors in Kleros. Once an initial ruling has been established, anyone interested will have
            the option to fund an appeal if they disagree with the outcome. Once finished, the funds will be released
            based on the ruling, and all arbitration fees from the winning side will be reimbursed. If you do not take
            any action before the deadline, you will automatically concede the dispute. The arbitration fee for you to
            continue the dispute is{" "}
            <span className="font-medium">
              {arbitrationCost ? `${formatEther(BigInt(arbitrationCost))} ETH` : "N/A"}
            </span>
            .
          </p>
          <p className="mb-2">Do you wish to pay the arbitration fee or concede the dispute?</p>
        </div>
        <div className="flex justify-between">
          <Button
            variant="danger"
            className="ml-2"
            onClick={async () => {
              await concedeDispute();
              setShowPayFeeModal(false);
            }}
          >
            Concede Dispute
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              await payArbitrationFee();
              setShowPayFeeModal(false);
            }}
          >
            Pay Arbitration Fee
          </Button>
        </div>
      </Modal>
    </>
  );
}
