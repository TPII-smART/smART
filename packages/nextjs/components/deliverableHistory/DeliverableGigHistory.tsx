import { useEffect, useState } from "react";
import { DeliverableCard } from "../Card/DeliverableCard/DeliverableCard";
import { Spinner } from "../Spinner/Spinner";
import Button from "@/components/Button/Button";
import { DeliverableState, GigState } from "@se-2/common";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import DeliverableReviewModal from "~~/components/DeliverableReviewModal/DeliverableReviewModal";
import { useGlobalSpinner } from "~~/context/SpinnerProvider";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { castDateToTimestamp, isImageUrl } from "~~/lib/utils";
import { fetchDeliverablesForGig, fetchGigById } from "~~/services/graphql/fetchers/gig/gig.service";
import { fetchUserProfile } from "~~/services/graphql/fetchers/profile.service";
import { UserProfile } from "~~/types/user-profile.type";
import { createEvidenceJSON } from "~~/utils/kleros-disputes/getEvidenceJSON";

export function DeliverableGigHistory(deliverableProps: any) {
  const [currentDeliverableIndex, setCurrentDeliverableIndex] = useState<number | null>(null);
  const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<UserProfile | null>(null);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const { showSpinner, hideSpinner } = useGlobalSpinner();
  const { address: userAddress } = useAccount();
  const { writeContractAsync: writeContract, isMining } = useScaffoldWriteContract({
    contractName: "GigsContract",
  });

  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["gig", deliverableProps.mainId],
    queryFn: async () => {
      const gig = await fetchGigById(deliverableProps.mainId);
      const deliverables = await fetchDeliverablesForGig(deliverableProps.mainId);
      return { gig, deliverables };
    },
  });

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["gigWithApplication", deliverableProps.mainId] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
  };

  useEffect(() => {
    const fetchProfiles = async (client: string, freelancer: string) => {
      if (client) {
        try {
          const profile = await fetchUserProfile(client);
          setClientProfile(profile);
        } catch (error) {
          console.error("Error fetching client profile:", error);
        }
      }
      if (freelancer) {
        try {
          const profile = await fetchUserProfile(freelancer);
          setFreelancerProfile(profile);
        } catch (error) {
          console.error("Error fetching freelancer profile:", error);
        }
      }
    };
    if (data) {
      fetchProfiles(data?.gig?.client || "", data?.gig?.acceptedFreelancer || "");
    }
  }, [data, isLoading]);

  const getAvatarSrc = (role: "client" | "freelancer") => {
    const user = role === "client" ? clientProfile : freelancerProfile;
    return user && isImageUrl(user.profilePicture || "") ? user.profilePicture : "";
  };
  const client = {
    name: clientProfile?.username || data?.gig?.client || "Unknown",
    address: clientProfile?.address || data?.gig?.client || "Unknown",
    avatarSrc: getAvatarSrc("client") || undefined,
    role: "Client",
  };
  const freelancer = {
    name: freelancerProfile?.username || data?.gig?.acceptedFreelancer || "Unknown",
    address: freelancerProfile?.address || data?.gig?.acceptedFreelancer || "Unknown",
    avatarSrc: getAvatarSrc("freelancer") || undefined,
    role: "Freelancer",
  };
  const isClient = userAddress?.toLowerCase() === client?.address?.toLowerCase();
  const gigState = data?.gig.state as GigState;

  const handleClientConfirmCompletion = async (clientResponse?: string) => {
    try {
      if (!data?.gig.gigId) return;
      showSpinner();
      await writeContract({
        functionName: "confirmClientCompletion",
        args: [BigInt(data.gig.gigId), clientResponse],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Confirm gig completion failed:", err);
    } finally {
      setShowDeliverableModal(false);
      hideSpinner();
    }
  };

  const handleRejectGig = async (reason: string) => {
    try {
      if (!data?.gig.gigId) return;
      showSpinner();
      const lastDeliverable = data?.deliverables && data.deliverables.length > 0 ? data.deliverables[0] : null;
      if (lastDeliverable?.resource) {
        const evidenceUri = await createEvidenceJSON(
          lastDeliverable.resource,
          "Rejected deliverable",
          `Deliverable rejected with the following reason: ${reason}`,
        );
        await writeContract({
          functionName: "rejectGig",
          args: [BigInt(data.gig.gigId), reason, evidenceUri],
        });
      }
      if (reload) await reload();
    } catch (err) {
      console.error("Reject gig failed:", err);
    } finally {
      setShowDeliverableModal(false);
      hideSpinner();
    }
  };

  const getActionButtons = (): React.ReactNode[] => {
    const buttons: React.ReactNode[] = [];

    if (isClient && gigState === GigState.InProgress && data?.gig.freelancerDelivered && !data?.gig.clientReceived) {
      const firstDeliverable = data?.deliverables[0];
      if (firstDeliverable?.state === DeliverableState.Pending) {
        buttons.push(
          <Button
            variant="primary"
            key="receive-0"
            onClick={() => {
              setShowDeliverableModal(true);
              setCurrentDeliverableIndex(0);
            }}
            disabled={isMining}
            size="sm"
            tooltip="Review Deliverable"
          >
            <span>Review</span>
          </Button>,
        );
      }
    }
    return buttons;
  };

  const isDisputed = gigState === GigState.Disputed || (gigState === GigState.Completed && !!data?.gig.disputeId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-64">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col px-8 py-4 space-y-4 mx-5">
      <div className="mb-8 ">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-bold text-balance">Deliverables History</h1>
        </div>
        <p className="text-muted-foreground text-lg">Track all project submissions and feedback in one place</p>
      </div>
      <div className="overflow-y-auto h-full space-y-20 py-4 px-20 ">
        <div className="space-y-4">
          {data?.deliverables?.map(deliverable => (
            <DeliverableCard
              key={`${deliverable.resource}-${deliverable.uploadedAt}`}
              deliverable={{
                ...deliverable,
                uploadedAt: castDateToTimestamp(deliverable.uploadedAt),
                responseTimestamp: castDateToTimestamp(deliverable.responseTimestamp),
              }}
              client={client}
              freelancer={freelancer}
              isDisputed={isDisputed}
              actionButtons={getActionButtons()}
            />
          ))}
        </div>
      </div>
      {showDeliverableModal && currentDeliverableIndex !== null && data?.deliverables[currentDeliverableIndex] && (
        <DeliverableReviewModal
          isOpen={showDeliverableModal}
          onClose={() => setShowDeliverableModal(false)}
          onApprove={handleClientConfirmCompletion}
          onReject={handleRejectGig}
          comment={data.deliverables[currentDeliverableIndex].submissionComment || ""}
          loading={isMining}
          showFullInfo={false}
          resource={data.deliverables[currentDeliverableIndex].resource}
          modalTitle="Review Deliverable"
          modalDescription="Please review the deliverable and provide your feedback."
        />
      )}
    </div>
  );
}
