import { useEffect, useState } from "react";
import { UniversalRoadmap } from "../Roadmap/UniversalRoadmap";
import { UniversalDetailProps } from "./type";
import { Badge } from "@/components/Badge";
import Button from "@/components/Button/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/Card";
import RatingStars from "@/components/RatingStars";
import Spinner from "@/components/Spinner/Spinner";
import { castHoursToDurationString, isImageUrl } from "@/lib/utils";
import { GigState, HiredTalentState } from "@se-2/common";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import * as Yup from "yup";
import { CalendarDaysIcon, ClockIcon, CurrencyDollarIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import AvatarImage from "~~/components/AvatarImage/AvatarImage";
import DeliverableReviewModal from "~~/components/DeliverableReviewModal/DeliverableReviewModal";
import FormModal from "~~/components/Modal/FormModal/FormModal";
import PreviewModal from "~~/components/Modal/PreviewModal/previewModal";
import RatingDisplay from "~~/components/RatingDisplay";
import UploadDeliverableForm from "~~/components/UploadFileForm/UploadFileForm";
import { useDisplayUsdMode } from "~~/hooks/scaffold-eth/useDisplayUsdMode";
import { fetchUserProfile } from "~~/services/graphql/fetchers/profile.service";
import { useGlobalState } from "~~/services/store/store";
import { UserProfile } from "~~/types/user-profile.type";

export default function UniversalDetail({
  data,
  deliverables,
  statusBadge,
  actionButtons,
  statusMessage,
  loading,
  error,
  reload,
  isDeliverableModalOpen,
  onCloseDeliverableModal,
  isRatingModalOpen,
  onCloseRatingModal,
  isMining,
  isDeliverableLoading,
  handleRateJob,
  initiateConflictResolution,
  handleFreelancerConfirmCompletion: handleUploadDeliverable,
  handleClientConfirmCompletion,
  handleRejectJob,
  isUploadModalOpen,
  onCloseUploadModal,
  isPreviewModalOpen,
  onCloseReviewModal: onClosePreviewModal,
}: UniversalDetailProps) {
  const { address: userAddress } = useAccount();

  // Information related to the users (client and freelancer)
  const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<UserProfile | null>(null);

  // Logic related to parsing from ETH to USD
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  // const isNativeCurrencyPriceFetching = useGlobalState(state => state.nativeCurrency.isFetching);
  const { displayUsdMode, toggleDisplayUsdMode } = useDisplayUsdMode({ defaultUsdMode: false });

  const isClient = data?.client?.toLowerCase() === userAddress?.toLowerCase();

  // Add this useEffect to fetch user profiles
  useEffect(() => {
    const fetchProfiles = async (client: string, freelancer: string) => {
      if (client) {
        try {
          const profile = await fetchUserProfile(client);
          setClientProfile(profile);
        } catch (error) {
          console.error("Failed to fetch client profile:", error);
        }
      }
      if (freelancer) {
        try {
          const profile = await fetchUserProfile(freelancer);
          setFreelancerProfile(profile);
        } catch (error) {
          console.error("Failed to fetch freelancer profile:", error);
        }
      }
    };

    if (data) {
      fetchProfiles(data?.client || "", data?.freelancer || "");
    }
  }, [data, loading]);

  const getAvatarSrc = (role: "client" | "freelancer") => {
    const user = role === "client" ? clientProfile : freelancerProfile;
    return user && isImageUrl(user.profilePicture || "") ? user.profilePicture : "";
  };

  const formatPaymentDisplay = (wei: bigint) => {
    const eth = formatEther(wei);
    const ethNum = parseFloat(eth);

    if (ethNum === 0) return "Free";

    if (displayUsdMode && nativeCurrencyPrice > 0) {
      const usdValue = ethNum * nativeCurrencyPrice;
      return `$${usdValue < 0.01 ? usdValue.toFixed(6) : usdValue.toFixed(2)}`;
    } else {
      if (ethNum < 0.001) return `${ethNum.toFixed(6)} ETH`;
      if (ethNum < 1) return `${ethNum.toFixed(4)} ETH`;
      return `${ethNum.toFixed(3)} ETH`;
    }
  };

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(Number(dateString) * 1000).toLocaleDateString() : "N/A";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-64">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen w-full p-8 bg-[var(--color-primary)]">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <ExclamationCircleIcon className="w-16 h-16 text-[var(--color-error)] mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-4 text-[var(--color-primary-content)]">Error loading job</h3>
                <p className="text-[var(--color-skeleton)] mb-6 text-lg">
                  {error?.message || "Failed to load job details"}
                </p>
                <Button
                  variant={"primary"}
                  onClick={reload}
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-8 py-3"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const validationSchema = Yup.object().shape({
    rating: Yup.number()
      .required("Please select a rating")
      .min(1, "Please select a rating")
      .max(5, "Rating must be between 1 and 5"),
  });

  const resource = deliverables?.[0]?.resource;
  const isLink = deliverables?.[0]?.isLink;
  const submissionComment = deliverables?.[0]?.submissionComment;
  const clientResponse = deliverables?.[0]?.clientResponse;

  const reviewModalDescription = isClient
    ? "You are about to review the deliverable submitted by the freelancer. Please ensure it meets the job requirements."
    : "You are about to review your last deliverable submmitted. Please ensure it meets the job requirements.";

  if (error || !data) {
    return (
      <div className="min-h-screen w-full p-8 bg-[var(--color-primary)]">
        <div className="max-w-6xl mx-auto">
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)]">
            <CardContent className="pt-12 pb-12">
              <div className="text-center">
                <ExclamationCircleIcon className="w-16 h-16 text-[var(--color-error)] mx-auto mb-6" />
                <h3 className="text-2xl font-semibold mb-4 text-[var(--color-primary-content)]">Error loading job</h3>
                <p className="text-[var(--color-skeleton)] mb-6 text-lg">
                  {error?.message || "Failed to load job details"}
                </p>
                <Button
                  variant={"primary"}
                  onClick={reload}
                  className="bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] text-white px-8 py-3"
                >
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-8 bg-[var(--color-primary)]">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
          <CardHeader className="p-8">
            <div className="flex items-start justify-between">
              <div className="space-y-4 flex-1">
                <CardTitle className="text-4xl font-bold text-[var(--color-primary-content)] leading-tight">
                  {data.title}
                </CardTitle>
                <div className="flex items-center gap-6">
                  {statusBadge}
                  <Badge className="bg-[var(--color-secondary)] text-[var(--color-secondary-content)] px-4 py-2 text-base">
                    {data.category}
                  </Badge>
                </div>
              </div>
              <div
                className="text-right bg-[var(--color-success)]/10 p-6 rounded-lg cursor-pointer"
                onClick={toggleDisplayUsdMode}
                title="Toggle USD/ETH display"
              >
                <div className="flex items-center text-4xl font-bold text-[var(--color-success)]">
                  {displayUsdMode ? <CurrencyDollarIcon className="w-8 h-8 mr-2" /> : null}
                  {formatPaymentDisplay(BigInt(data.payment || "0"))}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
        {/* Participants Section - Full Width */}
        <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
          <CardHeader className="p-6">
            <CardTitle className="text-2xl text-[var(--color-primary-content)]">Participants</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="font-semibold text-lg text-[var(--color-primary-content)]">Client</p>
                <div className="p-4 bg-[var(--color-primary)]/20 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AvatarImage
                      src={getAvatarSrc("client")}
                      alt="Client Avatar"
                      address={data.client as `0x${string}`}
                      width={96}
                      height={96}
                      onClickProfileNavigation={true}
                    />
                    <div className="flex-1">
                      <p className="text-[var(--color-primary-content)] font-medium mb-1">
                        {clientProfile?.username || data.client}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {data.freelancer && (
                <div className="space-y-3">
                  <p className="font-semibold text-lg text-[var(--color-primary-content)]">Freelancer</p>
                  <div className="p-4 bg-[var(--color-primary)]/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AvatarImage
                        src={getAvatarSrc("freelancer")}
                        alt="Freelancer Avatar"
                        address={data.freelancer as `0x${string}`}
                        width={96}
                        height={96}
                        onClickProfileNavigation={true}
                      />
                      <div className="flex-1">
                        <p className="text-[var(--color-primary-content)] font-medium mb-1">
                          {freelancerProfile?.username || data.freelancer}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - Job Details */}
          <div className="space-y-8">
            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
              <CardHeader className="p-6">
                <CardTitle className="text-2xl text-[var(--color-primary-content)]">
                  {data?.type === "hiredTalent" ? "Talent" : "Gig"} Description
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <div className="bg-[var(--color-primary)]/30 p-6 rounded-lg">
                  <p className="text-[var(--color-primary-content)] leading-relaxed text-lg">{data.description}</p>
                </div>
              </CardContent>
            </Card>

            {data?.type === "gig" && (
              <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
                <CardHeader className="p-6">
                  <CardTitle className="text-2xl text-[var(--color-primary-content)]">Freelancer Proposal</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <div className="bg-[var(--color-primary)]/30 p-6 rounded-lg">
                    <p className="text-[var(--color-primary-content)] leading-relaxed text-lg">
                      {data.proposalComment}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
              <CardHeader className="p-6">
                <CardTitle className="text-2xl text-[var(--color-primary-content)]">Timeline & Duration</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-6">
                <div className="flex items-center gap-4 p-4 bg-[var(--color-primary)]/20 rounded-lg">
                  <div className="p-3 bg-[var(--color-accent)] rounded-full">
                    <ClockIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-[var(--color-primary-content)]">Duration</p>
                    <p className="text-[var(--color-skeleton)] text-base">
                      {castHoursToDurationString(+(data.duration ?? "0"))}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-[var(--color-primary)]/20 rounded-lg">
                  <div className="p-3 bg-[var(--color-info)] rounded-full">
                    <CalendarDaysIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-lg text-[var(--color-primary-content)]">Deadline</p>
                    <p className="text-[var(--color-skeleton)] text-base">
                      {data.state === HiredTalentState.WaitingForApproval
                        ? "Deadline not yet defined"
                        : formatDate(String(data.deadline))}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
              <CardHeader className="p-6">
                <CardTitle className="text-2xl text-[var(--color-primary-content)]">Delivery Status</CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-0 space-y-4">
                <div className="flex justify-between items-center p-4 bg-[var(--color-primary)]/20 rounded-lg">
                  <span className="text-base font-semibold text-[var(--color-primary-content)]">
                    Freelancer Delivered
                  </span>
                  <Badge
                    variant={data.freelancerDelivered ? "default" : "secondary"}
                    className={
                      data.freelancerDelivered
                        ? "bg-[var(--color-success)] text-[var(--color-primary-content)]"
                        : "bg-[var(--color-secondary)] text-[var(--color-secondary-content)]"
                    }
                  >
                    {data.freelancerDelivered ? "Yes" : "No"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center p-4 bg-[var(--color-primary)]/20 rounded-lg">
                  <span className="text-base font-semibold text-[var(--color-primary-content)]">Client Received</span>
                  <Badge
                    variant={data.clientReceived ? "default" : "secondary"}
                    className={
                      data.clientReceived
                        ? "bg-[var(--color-success)] text-[var(--color-primary-content)]"
                        : "bg-[var(--color-secondary)] text-[var(--color-secondary-content)]"
                    }
                  >
                    {data.clientReceived ? "Yes" : "No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Job Roadmap */}
          <div className="space-y-8">
            <div className="flex flex-col h-full">
              <UniversalRoadmap data={data} type={data.type} />
            </div>{" "}
          </div>
        </div>
        {/* Action Section - Split into two boxes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.state === GigState.Completed || data.state === HiredTalentState.Finished ? (
            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {statusMessage && (
                    <div className="bg-[var(--color-primary)]/20 p-2 rounded-lg flex justify-center">
                      <RatingDisplay
                        ratingData={{
                          averageRating: data.rating || 0,
                          totalRatings: 1,
                          hiredTalentRatings: {},
                          gigRatings: {},
                        }}
                        interactive={false}
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
              <CardContent className="p-6">
                <div className="space-y-4 h-full flex flex-row">
                  {statusMessage && (
                    <div className="bg-[var(--color-primary)]/20 p-4 rounded-lg flex-1">
                      <div className="flex items-center space-x-4 mt-2 justify-around ">
                        <div className="text-[var(--color-primary-content)] text-base leading-relaxed m-0">
                          {statusMessage}
                        </div>
                        {data?.state === HiredTalentState.Ongoing && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="primary"
                              size={"md"}
                              onClick={() => {
                                initiateConflictResolution();
                              }}
                              disabled={isMining}
                              tooltip="Dispute resolution"
                              circular={true}
                            >
                              <ExclamationCircleIcon className="h-8 w-8" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {/* Action Buttons Box */}
          <Card className="bg-[var(--color-surface)] border-[var(--color-border)] shadow-lg">
            <CardContent className="p-12">
              <div className="flex justify-center items-center h-full">
                <div className="flex gap-6 flex-wrap justify-center">{actionButtons}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="h-8 mb-8" />

      {/* Confirm Modal */}
      <UploadDeliverableForm
        onSubmit={handleUploadDeliverable}
        loading={isMining && isDeliverableLoading}
        isOpen={isUploadModalOpen}
        onClose={onCloseUploadModal}
        modalTitle="Upload Deliverable"
        modalDescription={`You are about to upload your deliverable.\nPlease upload the required file or paste a link, and optionally add a comment for the client.\nPayment will be released once the client confirms receipt.`}
      />

      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={onClosePreviewModal}
        modalTitle="Preview of deliverable"
        modalDescription={reviewModalDescription}
        resource={resource || ""}
        isLink={isLink || false}
        comment={isClient ? submissionComment || "" : clientResponse || ""}
        isClient={isClient}
      />

      <DeliverableReviewModal
        isOpen={isDeliverableModalOpen}
        onClose={onCloseDeliverableModal}
        onApprove={handleClientConfirmCompletion}
        onReject={handleRejectJob}
        resource={resource || ""}
        isLink={isLink || false}
        comment={isClient ? submissionComment || "" : clientResponse || ""}
        loading={isMining && isDeliverableLoading}
        showFullInfo={true}
      />

      {/* Rating modal for client */}
      <FormModal
        modalProps={{
          title: "Rate Freelancer's Work",
          onClose: onCloseRatingModal,
          isOpen: isRatingModalOpen,
          loading: isMining,
          width: 350,
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
    </div>
  );
}
