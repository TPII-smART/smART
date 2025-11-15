import { useCallback, useEffect, useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { DisputeStatus, Ruling, useDisputeContracts } from "../../../hooks/use-dispute-contracts";
import UniversalDetail from "../UniversalDetail";
import { Badge } from "@/components/Badge";
import Button from "@/components/Button/Button";
import AppealFormModal, { AppealFormData } from "@/components/DisputeForm/AppealForm";
import DisputeFormModal, { DisputeFormData } from "@/components/DisputeForm/DisputeForm";
import Spinner from "@/components/Spinner/Spinner";
import { InputBase } from "@/components/scaffold-eth";
import { HiredTalentState } from "@se-2/common";
import { fetchDisputeById } from "@services/graphql/fetchers/dispute";
import { fetchHiredTalent } from "@services/graphql/fetchers/hiredTalent";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { ScaleIcon, StarIcon, TrophyIcon } from "@heroicons/react/20/solid";
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { hiredTalentCategories } from "~~/components/Card/HiredTalentCategory/hiredTalentCategory.data";
import FileUploadBox from "~~/components/FileUploadBox";
import Modal from "~~/components/Modal/Modal";
import { FileFormData } from "~~/components/UploadFileForm/types";
import { useGlobalSpinner } from "~~/context/SpinnerProvider";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadToIPFS } from "~~/services/IPFS/pinataIPFS";
import { fetchDeliverablesForHiredTalent } from "~~/services/graphql/fetchers/hiredTalent/hiredTalent.service";
import { Deliverable } from "~~/types/deliverable";
import { DetailData } from "~~/types/detail/detail.type";
import { Dispute } from "~~/types/dispute/dispute.type";
import { HiredTalent } from "~~/types/hiredTalent";
import { createInitialEvidencePDF } from "~~/utils/kleros-disputes/createInitialEvidencePDF";
import { createAndUploadEvidence, createEvidenceJSON } from "~~/utils/kleros-disputes/getEvidenceJSON";
import { getMetaEvidenceURI } from "~~/utils/kleros-disputes/getMetaEvidenceJSON";

export default function HiredTalentDetail({ talentId, hiredTalentId }: { talentId: string; hiredTalentId: string }) {
  const { address: userAddress } = useAccount();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showPayFeeModal, setShowPayFeeModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);
  const [showUploadEvidenceModal, setShowUploadEvidenceModal] = useState(false);
  const [evidenceFile, setEvidenceFileValue] = useState<File | undefined>(undefined);
  const [evidenceComment, setEvidenceComment] = useState<string>("");

  const [fundingSide, setFundingSide] = useState<"client" | "freelancer">("client");

  const queryClient = useQueryClient();
  const router = useRouter();

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "HiredTalentsContract",
  });
  const { showSpinner, hideSpinner } = useGlobalSpinner();

  const {
    data,
    isLoading: isDetailLoading,
    error,
    refetch,
  } = useQuery<HiredTalent>({
    queryKey: ["hiredTalentDetail", hiredTalentId],
    queryFn: () => fetchHiredTalent(talentId, hiredTalentId),
  });

  const {
    data: disputeData,
    isLoading: isDisputeLoading,
    refetch: refetchDispute,
  } = useQuery<Dispute>({
    queryKey: ["disputeDetail", data?.disputeId],
    queryFn: () => fetchDisputeById(data?.disputeId || 0),
  });

  useEffect(() => {
    if (!isDetailLoading && !data) {
      notFound();
    }
  }, [isDetailLoading, data]);

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

  const isLoading = isDetailLoading || isDisputeLoading;
  const hiredTalent = data as HiredTalent;
  const isRejected = hiredTalent?.clientRejected;
  const isFreelancer = hiredTalent?.freelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isClient = hiredTalent?.client?.toLowerCase() === userAddress?.toLowerCase();
  const hiredTalentStatus = hiredTalent?.state as HiredTalentState;
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
  } = useDisputeContracts(data?.disputeId);

  const reload = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ["hiredTalentDetail", talentId, hiredTalentId] });
    queryClient.invalidateQueries({ queryKey: ["disputeDetail", data?.disputeId] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
    await refetchDeliverables();
    await refetchDispute();
  }, [data?.disputeId, hiredTalentId, queryClient, refetch, refetchDeliverables, refetchDispute, talentId]);

  useEffect(() => {
    reload();
  }, [disputeStatus, disputeCurrentRuling, reload]);

  const disputeLoading =
    isDisputeCurrentRulingLoading || isDisputeStatusLoading || isFreelancerFeeLoading || isClientFeeLoading;

  const initiateConflictResolution = async (values: DisputeFormData) => {
    if (!data?.hiredTalentId || !data?.talentId) return;
    showSpinner();
    try {
      const metaDataURI = getMetaEvidenceURI();

      // Upload the Initial Evidence PDF as part of the dispute creation process
      const initialEvidenceFile = await createInitialEvidencePDF(
        new Date().toISOString().split("T")[0],
        isFreelancer ? "Freelancer" : "Client",
        `
        Client address: ${data?.client}\n
        Freelancer: ${data?.freelancer}\n
        Freelancer job Title: ${data?.title}\n
        Freelancer job Description: ${data?.description || ""}\n
        Payment proposed: ${formatEther(BigInt(data?.payment || 0))} ETH\n`,
        values.comment,
      );

      const evidenceJSON = await createAndUploadEvidence(
        initialEvidenceFile,
        "Raised Dispute Evidence",
        "All the information regarding the job present in the platform.",
      );

      await writeContract({
        functionName: "startDispute",
        args: [BigInt(data?.talentId), BigInt(data?.hiredTalentId), metaDataURI, evidenceJSON, values.comment],
        value: BigInt(arbitrationCost || 0),
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
    if (!data?.disputeId || !data?.hiredTalentId || !data?.talentId) return;
    if (data?.disputeId === 0) return;
    if (!freelancerFee || !clientFee) return;
    const feeToUse = isFreelancer ? freelancerFee : clientFee;
    showSpinner();
    try {
      await writeContract({
        functionName: "payArbitrationFee",
        args: [BigInt(data?.talentId), BigInt(data?.hiredTalentId)],
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

  const dismissDispute = async () => {
    if (!data?.disputeId || !data?.hiredTalentId || !data?.talentId) return;
    if (data?.disputeId === 0) return;
    showSpinner();
    try {
      await writeContract({
        functionName: "dismissDispute",
        args: [BigInt(data?.talentId), BigInt(data?.hiredTalentId)],
      });
      reload();
    } catch (error) {
      console.error("Error dismissing dispute:", error);
    } finally {
      hideSpinner();
      setShowPayFeeModal(false);
    }
  };

  const handleFinalizeDispute = async () => {
    if (!data?.disputeId || !data?.hiredTalentId || !data?.talentId) return;
    showSpinner();
    try {
      await writeContract({
        functionName: "finalizeDispute",
        args: [BigInt(data?.talentId), BigInt(data?.hiredTalentId)],
      });
      reload();
    } catch (error) {
      console.error("Error finalizing dispute:", error);
    } finally {
      hideSpinner();
    }
  };

  const handleFundAppeal = async (values: AppealFormData, side: "client" | "freelancer") => {
    if (!data?.disputeId || !data?.hiredTalentId || !data?.talentId) return;
    if (data?.disputeId === 0) return;
    if (disputeStatus !== DisputeStatus.Appealable) return;
    if (!freelancerFee || !clientFee) return;
    showSpinner();
    try {
      await writeContract({
        functionName: "fundAppeal",
        args: [
          BigInt(data?.talentId),
          BigInt(data?.hiredTalentId),
          side === "client" ? Ruling.ClientWins : Ruling.FreelancerWins,
        ],
        value: parseEther(values.funds.toString()),
      });
      reload();
    } catch (error) {
      console.error("Error funding appeal:", error);
    } finally {
      hideSpinner();
    }
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

      showSpinner();

      if (deliverableData.file) {
        resource = (await handleFileUploadToIPFS(deliverableData.file)) || "";
      }
      const deliverableIndex = deliverables ? deliverables.length + 1 : 1;
      await writeContract({
        functionName: "confirmFreelancerCompletion",
        args: [
          BigInt(hiredTalent.talentId),
          BigInt(hiredTalent.hiredTalentId),
          {
            resource,
            parsedResource: await createEvidenceJSON(
              resource,
              `Freelancer Deliverable Submission N° ${deliverableIndex}`,
              `Deliverable submission by Freelancer.${deliverableData.submissionComment ? ` Comment provided on submit: ${deliverableData.submissionComment}` : ""}`,
            ),
            submissionComment: deliverableData.submissionComment,
          },
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
      const lastDeliverable = deliverables && deliverables.length > 0 ? deliverables[0] : null;
      if (lastDeliverable?.resource) {
        const evidenceUri = await createEvidenceJSON(
          lastDeliverable.resource,
          "Rejected deliverable",
          `Deliverable rejected with the following reason: ${clientResponse}`,
        );
        await writeContract({
          functionName: "rejectHiredTalent",
          args: [BigInt(hiredTalent.talentId), BigInt(hiredTalent.hiredTalentId), clientResponse, evidenceUri],
        });
      }
      if (reload) await reload();
    } catch (err) {
      console.error("Reject deliverable failed:", err);
    } finally {
      setShowDeliverableModal(false);
      hideSpinner();
    }
  };

  const isWaiting = disputeDetail?.raiseOnKleros && disputeStatus === DisputeStatus.Waiting;
  const currentDeadline = (disputeDetail?.currentRound || 0) == 0 ? disputeDetail?.roundDeadline : appealDeadline;
  const expiredRound =
    (!disputeDetail?.freelancerPaidArbitrationFee || !disputeDetail?.clientPaidArbitrationFee) &&
    disputeDetail?.roundDeadline &&
    new Date() > new Date(Number(currentDeadline) * 1000);

  console.log("Is Waiting:", isWaiting);
  console.log("Current Deadline:", currentDeadline);
  console.log("Expired Round:", expiredRound);

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

    const freelancerAmount = Number(disputeDetail?.freelancerFunds || 0);
    const clientAmount = Number(disputeDetail?.clientFunds || 0);
    const totalFreelancerAmount = Number(freelancerFee || 1);
    const totalClientAmount = Number(clientFee || 1);

    const freelancerPercentage = totalFreelancerAmount > 0 ? (freelancerAmount / totalFreelancerAmount) * 100 : 0;
    const clientPercentage = totalClientAmount > 0 ? (clientAmount / totalClientAmount) * 100 : 0;

    const formatPct = (p: number) => `${Math.max(0, Math.min(100, p)).toFixed(1)}%`;

    if (
      data?.state != undefined &&
      data?.state != HiredTalentState.Cancelled &&
      data?.state >= HiredTalentState.Ongoing
    ) {
      if (data?.disputeId && data?.disputeId > 0) {
        if (disputeDetail?.disputeFinished) return null;
        return (
          <div className="w-full">
            {disputeDetail?.currentlyDismissed ? (
              <p className="mr-1 w-[95%]">
                The dispute has been dismissed. Try to resolve the issue directly with the other party or start a new
                dispute.
              </p>
            ) : data?.disputeId && data?.disputeId > 0 ? (
              <div className="flex flex-col w-[100%] p-4 rounded-lg border border-gray-700 bg-gradient-to-r from-gray-900 via-[rgb(20,20,20)] to-[rgb(10,10,10)]">
                <div className="flex flex-col  justify-between w-full">
                  <div className="flex flex-col items-start">
                    <div className="text-md items-start font-semibold">Dispute overview</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {(() => {
                        const round = Number(disputeDetail?.currentRound ?? 0);
                        if (round === 0 || (round === 1 && disputeStatus === DisputeStatus.Waiting))
                          return "Initial Stage";
                        else if (round >= 1) return `Appeal Round ${round}`;
                        else return "Status unknown";
                      })()}
                      {" · "}
                      {!disputeDetail?.raiseOnKleros
                        ? "Not yet on Kleros"
                        : disputeStatus === DisputeStatus.Waiting
                          ? "Waiting for jurors"
                          : disputeStatus === DisputeStatus.Appealable
                            ? "Appealable (fund your side)"
                            : disputeStatus === DisputeStatus.Solved
                              ? "Ruled / Resolved"
                              : "Status unknown"}
                    </div>
                  </div>

                  {disputeDetail?.disputeReason && (
                    <div className="flex justify-between gap-3 mt-3 rounded-lg bg-orange-500/10 border border-orange-500/20 pt-4 pb-2 px-4">
                      <ExclamationTriangleIcon className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-medium text-orange-600 dark:text-orange-400 block mb-1">
                          Dispute Reason
                        </span>
                        <p className="text-xs text-foreground line-clamp-2">{disputeDetail?.disputeReason}</p>
                      </div>
                    </div>
                  )}
                </div>
                {!!disputeDetail?.freelancerPaidArbitrationFee !== !!disputeDetail?.clientPaidArbitrationFee &&
                  (disputeDetail?.currentRound || 0) == 0 && (
                    <div className="flex items-center space-x-4 mt-4">
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
                    <div className="space-y-3 mt-4">
                      {/* Freelancer Stake */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">Freelancer Stake</span>
                          <span className="text-sm font-bold text-foreground">
                            {`${formatEther(BigInt(freelancerAmount))} / ${formatEther(BigInt(totalFreelancerAmount))}`}{" "}
                            ETH <span className="text-xs">({formatPct(freelancerPercentage)})</span>
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
                          <span className="text-xs font-medium">Client Stake</span>
                          <span className="text-sm font-bold text-foreground">
                            {`${formatEther(BigInt(clientAmount))} / ${formatEther(BigInt(totalClientAmount))}`} ETH{" "}
                            <span className="text-xs">({formatPct(clientPercentage)})</span>
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

                <div>
                  {((!!disputeDetail?.freelancerPaidArbitrationFee !== !!disputeDetail?.clientPaidArbitrationFee &&
                    (disputeDetail?.currentRound || 0) == 0) ||
                    (disputeStatus === DisputeStatus.Appealable && disputeDetail?.raiseOnKleros)) && (
                    <div>
                      <p className="text-sm">
                        Deadline to{" "}
                        {disputeDetail?.clientPaidArbitrationFee && disputeDetail?.freelancerPaidArbitrationFee
                          ? "appeal"
                          : "pay fee"}
                        :{" "}
                        <span className="font-bold">
                          {disputeStatus === DisputeStatus.Appealable && appealDeadline
                            ? new Date(Number(appealDeadline) * 1000).toLocaleString()
                            : disputeDetail?.roundDeadline
                              ? new Date(Number(disputeDetail?.roundDeadline) * 1000).toLocaleString()
                              : "N/A"}
                        </span>
                      </p>
                    </div>
                  )}

                  {disputeDetail?.raiseOnKleros && disputeStatus === DisputeStatus.Waiting && (
                    <p className="mt-4">Waiting for the Kleros jurors to rule on the dispute.</p>
                  )}

                  {disputeCurrentRuling !== undefined &&
                    BigInt(disputeCurrentRuling) !== 0n &&
                    disputeDetail?.raiseOnKleros &&
                    disputeStatus !== DisputeStatus.Waiting && (
                      <div>
                        <p className="text-sm">
                          Current Ruling:{" "}
                          <span className="font-bold">
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
                </div>
              </div>
            ) : (
              <p>Got any problems? Initiate a dispute to resolve the issue.</p>
            )}
          </div>
        );
      } else {
        return <p>Got any problems? Initiate a dispute to resolve the issue.</p>;
      }
    }
    return "";
  };

  const handleViewDeliverable = () => {
    router.push(`/talents/${talentId}/${hiredTalentId}/deliverables`);
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

    if (
      hiredTalentStatus === HiredTalentState.Disputed &&
      disputeDetail &&
      !disputeDetail?.currentlyDismissed &&
      !disputeDetail?.disputeFinished &&
      disputeDetail?.raiseOnKleros
    ) {
      buttons.push(
        <Button
          variant="outline"
          key="uploadEvidence"
          onClick={() => setShowUploadEvidenceModal(true)}
          disabled={isMining}
          size="sm"
          tooltip="Upload evidence for dispute"
        >
          <ScaleIcon className="h-5 w-5" />
          <span>Upload evidence for dispute</span>
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
        hiredTalentStatus !== HiredTalentState.Disputed &&
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
      if (hiredTalentStatus === HiredTalentState.Disputed) {
        if (
          !isWaiting &&
          (expiredRound ||
            (disputeDetail?.raiseOnKleros &&
              disputeStatus === DisputeStatus.Solved &&
              (!disputeDetail?.disputeFinished || hiredTalent.state !== HiredTalentState.Finished)))
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
        } else if (!disputeDetail?.clientPaidArbitrationFee && (disputeDetail?.currentRound || 0) == 0) {
          buttons.push(
            <Button
              variant="danger"
              key="dismissDispute"
              onClick={() => dismissDispute()}
              disabled={isMining || disputeLoading}
              size="sm"
              tooltip="Dismiss Dispute"
            >
              <XCircleIcon className="h-5 w-5" />
              <span>Dismiss Dispute</span>
            </Button>,
          );
        }
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
        hiredTalentStatus !== HiredTalentState.Disputed &&
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
      if (hiredTalentStatus === HiredTalentState.Disputed) {
        if (
          !isWaiting &&
          (expiredRound ||
            (disputeDetail?.raiseOnKleros &&
              disputeStatus === DisputeStatus.Solved &&
              (!disputeDetail?.disputeFinished || hiredTalent.state !== HiredTalentState.Finished)))
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
        } else if (!disputeDetail?.freelancerPaidArbitrationFee && (disputeDetail?.currentRound || 0) == 0) {
          buttons.push(
            <Button
              variant="danger"
              key="dismissDispute"
              onClick={() => dismissDispute()}
              disabled={isMining || disputeLoading}
              size="sm"
              tooltip="Dismiss Dispute"
            >
              <XCircleIcon className="h-5 w-5" />
              <span>Dismiss Dispute</span>
            </Button>,
          );
        }
      }
    }

    if (hiredTalentStatus === HiredTalentState.Disputed && disputeStatus === DisputeStatus.Appealable) {
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
    wasDisputed: !!data?.disputeId,
    disputeFinalized: disputeDetail?.disputeFinished || false,
    disputeResult: disputeCurrentRuling !== undefined && BigInt(disputeCurrentRuling) === BigInt(Ruling.FreelancerWins),
    disputeDismissed: disputeDetail?.currentlyDismissed || false,
    clientRejected: data?.clientRejected || false,
  };

  return (
    <>
      <UniversalDetail
        workId={"hiredTalent-" + hiredTalentId + "-" + talentId}
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
        initiateConflictResolution={() => setShowDisputeModal(true)}
        handleRateJob={handleRateHiredTalent}
        handleFreelancerConfirmCompletion={handleFreelancerConfirmCompletion}
        handleClientConfirmCompletion={handleClientConfirmCompletion}
        handleRejectJob={handleRejectHiredTalent}
      />
      <DisputeFormModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        loading={isSubmittingDispute}
        arbitrationFee={arbitrationCost ? String(arbitrationCost) : "0"}
        type="hiredTalent"
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
        type="hiredTalent"
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
          {(disputeDetail?.timesDismissed ?? 0) < 1 ? (
            <>
              <p className="mb-2">
                The other party has opened a dispute to be resolved by Kleros. You have a one‑time option to dismiss the
                dispute if you believe the issue can be resolved off‑chain. Using this dismissal will pause the Kleros
                process but it can only be used once for this case. If you do not dismiss, you can match the arbitration
                fee and let Kleros jurors review the case. The arbitration fee to continue is{" "}
                <span className="font-medium">
                  {arbitrationCost ? `${formatEther(BigInt(arbitrationCost))} ETH` : "N/A"}
                </span>
                . If you neither pay nor dismiss before the deadline, the dispute will time out and the ruling will be
                entered in favor of the party who initiated the dispute.
              </p>
              <p className="mb-2">Do you wish to pay the arbitration fee or use the one‑time dismissal?</p>
            </>
          ) : (
            <>
              <p className="mb-2">
                A one‑time dismissal has already been used for this dispute, so no further dismissals are allowed. To
                keep the case in Kleros for juror review you must match the arbitration fee:
                <span className="font-medium">
                  {" "}
                  {arbitrationCost ? `${formatEther(BigInt(arbitrationCost))} ETH` : "N/A"}
                </span>
                . If you fail to pay before the deadline the dispute will time out and the ruling will be decided in
                favor of the initiator.
              </p>
              <p className="mb-2">Do you wish to pay the arbitration fee?</p>
            </>
          )}
        </div>
        <div className="flex justify-between">
          <Button
            variant="danger"
            className="ml-2"
            disabled={disputeDetail?.timesDismissed ? disputeDetail.timesDismissed >= 1 : false}
            onClick={async () => {
              await dismissDispute();
              setShowPayFeeModal(false);
            }}
          >
            Dismiss Dispute
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
      <Modal
        isOpen={showUploadEvidenceModal}
        onClose={() => setShowUploadEvidenceModal(false)}
        title="Uploading evidence"
      >
        <div className="mb-4">
          <p className="mb-2 text-center">
            The evidence provided in this section will be used in the dispute resolution process. Jurors will be able to
            review the evidence you submit here to make a better informed decision. Please ensure that all evidence is
            relevant and clearly presented.
          </p>
        </div>
        <FileUploadBox
          onUploadSuccess={(val: File) => setEvidenceFileValue(val)}
          onFileRemove={() => setEvidenceFileValue(undefined)}
          acceptedFileTypes={["Document", "Image", "Video"]}
        />
        <div className="mt-4">
          <label htmlFor="evidence-comment" className="block text-sm font-medium mb-2">
            Evidence Description
          </label>
          <InputBase
            placeholder="Comment for the evidence"
            multiline
            minRows={4}
            maxRows={4}
            variant="filled"
            value={evidenceComment}
            onChange={(val: string) => setEvidenceComment(val)}
          />
        </div>
        <div className="flex mt-4 justify-center items-center gap-4">
          <Button
            variant="primary"
            onClick={async () => {
              if (!evidenceFile || !data?.talentId || !data?.hiredTalentId) return;
              showSpinner();
              const evidenceUri = await createAndUploadEvidence(
                evidenceFile,
                "Evidence uploaded by" + (isClient ? " Client" : " Freelancer") + " via smART app",
                evidenceComment || "",
              );
              await writeContract({
                functionName: "submitEvidence",
                args: [BigInt(data.talentId), BigInt(data.hiredTalentId), evidenceUri],
              });
              setShowUploadEvidenceModal(false);
              hideSpinner();
              setEvidenceComment("");
            }}
            disabled={!evidenceFile}
          >
            Submit Evidence
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowUploadEvidenceModal(false);
              setEvidenceComment("");
            }}
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </>
  );
}
