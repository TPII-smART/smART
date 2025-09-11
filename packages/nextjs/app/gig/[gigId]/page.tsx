"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/dist/client/components/navigation";
import InfoHeader from "@/components/InfoHeader";
import Spinner from "@/components/Spinner/Spinner";
import { GigState } from "@se-2/common";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import * as Yup from "yup";
import { ArrowDownTrayIcon, PaperAirplaneIcon, StarIcon, UserIcon, XCircleIcon } from "@heroicons/react/24/outline";
import Button from "~~/components/Button/Button";
import ApplicationCard from "~~/components/Card/ApplicationCard/ApplicationCard";
import DeliverableReviewModal from "~~/components/DeliverableReviewModal/DeliverableReviewModal";
import FormModal from "~~/components/Modal/FormModal/FormModal";
import RatingStars from "~~/components/RatingStars";
import UploadFileForm from "~~/components/UploadFileForm/UploadFileForm";
import { FileFormData } from "~~/components/UploadFileForm/types";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { uploadToIPFS } from "~~/services/IPFS/thirdwebIPFS";
import { fetchGigWithApplication } from "~~/services/graphql/fetchers/gig/gig.service";
import { Application, Gig } from "~~/types/gig/gig.types";
import { getGigStatus } from "~~/utils/scaffold-eth/Status/getStatus";

type GigData = {
  gig: Gig;
  applications: Application[];
};

export default function GigPage() {
  const { gigId } = useParams();
  const { address: userAddress } = useAccount();
  const queryClient = useQueryClient();
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);

  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "GigsContract",
  });

  const { data, isLoading, refetch } = useQuery<GigData>({
    queryKey: ["gigWithApplication", gigId],
    queryFn: async () => {
      const result = await fetchGigWithApplication(gigId as string);
      return {
        gig: result.gig,
        applications: result.applications.applications,
      };
    },
    enabled: typeof gigId === "string" && !!gigId,
  });

  const gigState = data?.gig.state as GigState;
  const isClient = data?.gig.client?.toLowerCase() === userAddress?.toLowerCase();
  const isFreelancer = data?.gig.acceptedFreelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isAcceptedFreelancer = data?.gig.acceptedFreelancer?.toLowerCase() === userAddress?.toLowerCase();
  const isRejected = data?.gig.clientRejected;

  // Find the accepted application to display worker info
  const acceptedApplication = data?.applications?.find(app => app.applicationId === data?.gig.acceptedApplicationId);

  useEffect(() => {
    queryClient.invalidateQueries({
      queryKey: ["gigWithApplication", gigId],
    });
  });

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

      console.log("entre");
      console.log("fileData", fileData);

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

  // Format ETH price display
  const formatEthPrice = (wei: bigint) => {
    const eth = formatEther(wei);
    const num = parseFloat(eth);
    if (num === 0) return "Free";
    if (num < 0.001) return `${num.toFixed(6)} ETH`;
    if (num < 1) return `${num.toFixed(4)} ETH`;
    return `${num.toFixed(3)} ETH`;
  };

  const getActionButtons = () => {
    const buttons = [];

    // Freelancer actions
    if (
      isAcceptedFreelancer &&
      gigState !== GigState.Completed &&
      gigState !== GigState.Cancelled &&
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
    if (
      isAcceptedFreelancer &&
      gigState === GigState.InProgress &&
      !data?.gig.freelancerCancelled &&
      !data?.gig.clientCancelled
    ) {
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

    // Client actions
    if (isClient && gigState === GigState.InProgress) {
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
    if (isClient && gigState === GigState.Completed && !data?.gig.rating) {
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
    if (isClient && gigState !== GigState.Completed && gigState !== GigState.Cancelled && !data?.gig.clientCancelled) {
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

    return buttons;
  };

  const comment = isClient ? data?.gig.submissionComment : data?.gig.clientResponse;

  const validationSchema = Yup.object().shape({
    rating: Yup.number()
      .required("Please select a rating")
      .min(1, "Please select a rating")
      .max(5, "Rating must be between 1 and 5"),
  });

  return (
    <>
      <div className="w-full h-full overflow-auto">
        <div className="flex flex-col min-h-screen mt-8">
          <div className="w-full px-4 md:px-6 lg:px-8">
            {isLoading ? (
              <div className="flex items-center justify-center w-full h-64">
                <Spinner />
              </div>
            ) : (
              <div>
                <InfoHeader data={data?.gig} />
                {gigState === GigState.Open ? (
                  <div className="mb-8 mt-8">
                    <h1 className="text-xl font-bold text-content-primary mb-4 mt-6">
                      Manage Applications for this Gig
                    </h1>
                    {data?.applications && data.applications.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {data?.applications.map(application => (
                          <ApplicationCard
                            key={application.applicationId}
                            client={application.gig?.client}
                            application={application}
                            reload={reload}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="text-content-secondary text-lg">No applications found.</p>
                        <p className="text-content-tertiary mt-2">Wait for freelancers to apply to your gig.</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-8 mt-8">
                    <h1 className="text-xl font-bold text-content-primary mb-4 mt-6">Gig Workflow</h1>
                    {/* Gig Status Section */}
                    <div className="bg-base-100 rounded-lg shadow-md p-6 mb-6">
                      <h2 className="text-lg font-semibold text-content-primary mb-4">Current Status</h2>
                      {(() => {
                        const statusInfo = getGigStatus(gigState, data?.gig as Gig, isFreelancer, isClient);
                        const StatusIcon = statusInfo.icon;
                        return (
                          <div className="flex items-center gap-3">
                            <div className={`h-4 w-4 rounded-full ${statusInfo.color}`}></div>
                            <StatusIcon className="h-6 w-6 text-content-tertiary" />
                            <span className="text-lg font-medium text-content-secondary">{statusInfo.label}</span>
                            <span className="text-sm text-content-tertiary">- {statusInfo.description}</span>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Working Freelancer Info */}
                    {acceptedApplication && gigState === GigState.InProgress && (
                      <div className="bg-base-100 rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold text-content-primary mb-4">Working on this Gig</h2>
                        <div className="flex items-center gap-4">
                          <UserIcon className="h-8 w-8 text-content-tertiary" />
                          <div className="flex-1">
                            <p className="text-content-primary font-medium">
                              Freelancer: {acceptedApplication.freelancer}
                            </p>
                            <p className="text-content-secondary text-sm">
                              Agreed Payment:{" "}
                              {acceptedApplication.proposedPayment
                                ? formatEthPrice(BigInt(acceptedApplication.proposedPayment))
                                : "Free"}
                            </p>
                            <p className="text-content-secondary text-sm">
                              Duration: {acceptedApplication.proposedDurationInHours} hours
                            </p>
                            {data?.gig.deadline && (
                              <p className="text-content-secondary text-sm">
                                Deadline: {new Date(Number(data.gig.deadline) * 1000).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        {acceptedApplication.proposalComment && (
                          <div className="mt-4 p-3 bg-base-200 rounded-md">
                            <p className="text-sm text-content-secondary">
                              <span className="font-medium">Proposal:</span> {acceptedApplication.proposalComment}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Completion Status for In Progress Gigs */}
                    {gigState === GigState.InProgress && (
                      <div className="bg-base-100 rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold text-content-primary mb-4">Completion Progress</h2>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-3 w-3 rounded-full ${data?.gig.freelancerDelivered ? "bg-green-500" : "bg-gray-300"}`}
                            ></div>
                            <span
                              className={`text-sm ${data?.gig.freelancerDelivered ? "text-content-primary font-medium" : "text-content-tertiary"}`}
                            >
                              Freelancer delivered work
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-3 w-3 rounded-full ${data?.gig.clientReceived ? "bg-green-500" : "bg-gray-300"}`}
                            ></div>
                            <span
                              className={`text-sm ${data?.gig.clientReceived ? "text-content-primary font-medium" : "text-content-tertiary"}`}
                            >
                              Client received work
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rating Display for Completed Gigs */}
                    {gigState === GigState.Completed && data?.gig.rating && (
                      <div className="bg-base-100 rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-lg font-semibold text-content-primary mb-4">Rating</h2>
                        <div className="flex items-center gap-3">
                          <span className="text-content-secondary">Client rating:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <StarIcon
                                key={star}
                                className={`h-5 w-5 ${star <= data.gig.rating! ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                            <span className="ml-2 text-content-primary font-medium">{data.gig.rating}/5</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="bg-base-100 rounded-lg shadow-md p-6">
                      <h2 className="text-lg font-semibold text-content-primary mb-4">Actions</h2>
                      <div className="flex flex-wrap gap-3">{getActionButtons()}</div>
                      {getActionButtons().length === 0 && (
                        <p className="text-content-tertiary text-sm">No actions available at this time.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      <UploadFileForm
        onSubmit={handleConfirmCompletion}
        loading={isMining}
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        modalTitle="Submit Deliverable"
        modalDescription={`You are about to submit your deliverable for this job.\nPlease upload the required file or paste a link, and optionally add a comment for the client.\nPayment will be released once the client confirms receipt.`}
      />

      {console.log("gig.resource", data?.gig.resource, data?.gig.isLink)}

      <DeliverableReviewModal
        isOpen={showDeliverableModal}
        onApprove={handleConfirmCompletion}
        onReject={reason => handleRejectGig(reason)}
        onClose={() => setShowDeliverableModal(false)}
        modalTitle="Deliverable Review"
        modalDescription="Please review the deliverable and provide your feedback."
        resource={data?.gig.resource ? data?.gig.resource : ""}
        isLink={data?.gig.isLink ? data?.gig.isLink : false}
        comment={comment ? comment : ""}
        canUploadFile={isFreelancer && isRejected}
        loading={isMining}
      />

      {/* Rating Modal */}
      <FormModal
        modalProps={{
          title: "Rate Freelancer's Work",
          onClose: () => setIsRatingModalOpen(false),
          isOpen: isRatingModalOpen,
          loading: isMining,
        }}
        formikProps={{
          onSubmit: values => handleRateGig(values.rating),
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
