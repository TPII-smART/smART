"use client";

import { useState } from "react";
import UniversalDetail from "../UniversalDetail";
import { ApplicationState, GigState } from "@se-2/common";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  ArrowDownTrayIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  StarIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { Badge } from "~~/components/Badge";
import Button from "~~/components/Button/Button";
import { FileFormData } from "~~/components/UploadFileForm/types";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
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
  const queryClient = useQueryClient();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "GigsContract",
  });

  console.log("GigDetail props", { gigId, applicationId, type });

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

  console.log("GigDetail data", data);
  const application = data?.applications.find(app => String(app.applicationId) === String(applicationId));

  const gigState = data?.gig.state as GigState;
  const applicationState = application?.state as ApplicationState;
  const isClient = data?.gig.client?.toLowerCase() === userAddress?.toLowerCase();
  const freelancer = data?.gig.acceptedFreelancer ? data?.gig.acceptedFreelancer : application?.freelancer;
  const isFreelancer = freelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isRejected = data?.gig.clientRejected;

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["gigWithApplication", gigId] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
  };

  const handleFileUploadToIPFS = async (file: File | undefined) => {
    if (!file) return;

    return await uploadToIPFS(file);
  };

  const handleUploadFile = async (fileData: FileFormData) => {
    try {
      let resource = "";
      const isLink = fileData.isLink;

      if (!data?.gig.gigId) return;

      if (fileData.file && !isLink) {
        resource = (await handleFileUploadToIPFS(fileData.file)) || "";
      } else if (!fileData.file && isLink) {
        resource = fileData.link || "";
      }

      await writeContract({
        functionName: "uploadFile",
        args: [BigInt(data?.gig.gigId), { resource, submissionComment: fileData.submissionComment, isLink }],
      });
    } catch (err) {
      console.error("Upload file failed:", err);
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

      if (!data?.gig.gigId) return;
      await writeContract({
        functionName: "confirmCompletion",
        args: [BigInt(data.gig.gigId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Confirm gig completion failed:", err);
    }
  };

  const handleCancel = async () => {
    try {
      if (!data?.gig.gigId) return;
      await writeContract({
        functionName: "cancelGig",
        args: [BigInt(data.gig.gigId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Cancel gig failed:", err);
    }
  };

  const handleRateGig = async (rating: number) => {
    try {
      if (!data?.gig.gigId) return;
      await writeContract({
        functionName: "rateGig",
        args: [BigInt(data.gig.gigId), rating],
      });
      setIsRatingModalOpen(false);
      if (reload) await reload();
    } catch (err) {
      console.error("Rate gig failed:", err);
    }
  };

  const handleAddComment = async (comment: string) => {
    try {
      if (!data?.gig.gigId) return;
      await writeContract({
        functionName: "addCommentToGig",
        args: [BigInt(data.gig.gigId), comment],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Write comment failed:", err);
    }
  };

  const handleRejectGig = async (reason: string) => {
    try {
      if (!data?.gig.gigId) return;
      await writeContract({
        functionName: "rejectGig",
        args: [BigInt(data.gig.gigId)],
      });

      if (reload) await reload();

      await handleAddComment(reason);
    } catch (err) {
      console.error("Reject gig failed:", err);
    } finally {
      setShowDeliverableModal(false);
    }
  };

  const handleAcceptApplication = async () => {
    try {
      if (application?.state !== ApplicationState.Pending) return;
      await writeContract({
        functionName: "acceptApplication",
        args: [BigInt(application.gigId), BigInt(application.applicationId)],
        value: BigInt(application.proposedPayment),
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Accept application failed:", err);
    }
  };

  const handleRejectApplication = async () => {
    try {
      if (application?.state !== ApplicationState.Pending) return;
      await writeContract({
        functionName: "rejectApplication",
        // TODO: Add modal for rejection comment
        args: [BigInt(application.gigId), BigInt(application.applicationId), "User rejected the application"],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Reject application failed:", err);
    }
  };

  const handleApplicationWithdraw = async () => {
    try {
      if (application?.state !== ApplicationState.Pending) return;
      await writeContract({
        functionName: "withdrawApplication",
        args: [BigInt(application.gigId), BigInt(application.applicationId)],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Withdraw application failed:", err);
    }
  };

  const getActionButtons = () => {
    const buttons = [];

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
      if (gigState === GigState.InProgress && !data?.gig.freelancerCancelled && !data?.gig.clientCancelled) {
        if (!data?.gig.freelancerDelivered) {
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
              Mark as Delivered
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
            tooltip="Approve Job"
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
                tooltip="Mark as Received"
              >
                <ArrowDownTrayIcon className="h-5 w-5" />
                Mark as Received
              </Button>,
            );
          }
        }

        // Rating button for client when gig is completed
        if (gigState === GigState.Completed && !data?.gig.rating) {
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
        if (gigState !== GigState.Completed && gigState !== GigState.Cancelled && !data?.gig.clientCancelled) {
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
      }
    }

    return buttons;
  };

  // Action buttons based on user role and gig state
  // const getActionButtons = () => {
  //   const buttons = [];

  //   if (isClient) {
  //     if (applicationStatus === ApplicationState.Pending) {
  //       buttons.push(
  //         <Button
  //           variant="danger"
  //           key="cancel"
  //           onClick={handleReject}
  //           disabled={isMining}
  //           size="sm"
  //           tooltip="Cancel Job"
  //         >
  //           <XCircleIcon className="h-5 w-5" />
  //         </Button>,
  //       );
  //       buttons.push(
  //         <Button
  //           variant="primary"
  //           key="approve"
  //           onClick={handleAccept}
  //           disabled={isMining}
  //           size="sm"
  //           tooltip="Approve Job"
  //         >
  //           <CheckCircleIcon className="h-5 w-5" />
  //         </Button>,
  //       );
  //     }
  //     if (applicationStatus === ApplicationState.Accepted) {
  //       buttons.push(
  //         <Button
  //           variant="outline"
  //           key="view"
  //           onClick={() => {
  //             window.location.href = `/gig/${application.gigId}`;
  //           }}
  //           disabled={isMining}
  //           size="sm"
  //           tooltip="Gig Details"
  //         >
  //           Gig Details
  //         </Button>,
  //       );
  //     }
  //   }

  //   if (isFreelancer) {
  //     if (applicationStatus === ApplicationState.Pending) {
  //       buttons.push(
  //         <Button
  //           variant="danger"
  //           key="cancel"
  //           onClick={handleWithdraw}
  //           disabled={isMining}
  //           size="sm"
  //           tooltip="Withdraw application"
  //         >
  //           <XCircleIcon className="h-5 w-5" />
  //         </Button>,
  //       );
  //     }
  //     if (applicationStatus === ApplicationState.Accepted) {
  //       buttons.push(
  //         <Button
  //           variant="outline"
  //           key="view"
  //           onClick={() => {
  //             window.location.href = `/gig/${application.gigId}`;
  //           }}
  //           disabled={isMining}
  //           size="sm"
  //           tooltip="Gig Details"
  //         >
  //           Gig Details
  //         </Button>,
  //       );
  //     }
  //   }

  //   return buttons;
  // };

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

    if (data?.gig.state != undefined && data?.gig.state >= GigState.InProgress) {
      return "¿Facing any problems with this gig?";
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
  };

  const finalDetailData: DetailData = {
    type: "gig",
    title: data?.gig.title || "",
    description: data?.gig.description || "",
    client: data?.gig.client,
    freelancer: data?.gig.acceptedFreelancer,
    category: data?.gig.category || "",
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
        handleConfirmCompletion={handleConfirmCompletion}
        handleRejectJob={handleRejectGig}
        handleRateJob={handleRateGig}
      />
    </>
  );
}
