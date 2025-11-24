import { useEffect, useState } from "react";
import { DeliverableCard } from "../Card/DeliverableCard/DeliverableCard";
import { queryClient } from "../ScaffoldEthAppWithProviders";
import { Spinner } from "../Spinner/Spinner";
import { DeliverableHistoryProps } from "./types";
import Button from "@/components/Button/Button";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import DeliverableReviewModal from "~~/components/DeliverableReviewModal/DeliverableReviewModal";
import { useGlobalSpinner } from "~~/context/SpinnerProvider";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { castDateToTimestamp, isImageUrl } from "~~/lib/utils";
import {
  fetchDeliverablesForHiredTalent,
  fetchHiredTalent,
} from "~~/services/graphql/fetchers/hiredTalent/hiredTalent.service";
import { fetchUserProfile } from "~~/services/graphql/fetchers/profile.service";
import { DeliverableState } from "~~/types/deliverable/deliverable.type";
import { HiredTalent } from "~~/types/hiredTalent";
import { HiredTalentState } from "~~/types/hiredTalent/hiredTalent.types";
import { UserProfile } from "~~/types/user-profile.type";
import { createEvidenceJSON } from "~~/utils/kleros-disputes/getEvidenceJSON";

export function DeliverableTalentHistory(deliverableProps: DeliverableHistoryProps) {
  const [currentDeliverableIndex, setCurrentDeliverableIndex] = useState<number | null>(null);
  const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<UserProfile | null>(null);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const { showSpinner, hideSpinner } = useGlobalSpinner();
  const { address: userAddress } = useAccount();
  const { writeContractAsync: writeJobContract, isMining } = useScaffoldWriteContract({
    contractName: "HiredTalentsContract",
  });
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["HiredTalent", deliverableProps.mainId, deliverableProps.secondaryId],
    queryFn: async () => {
      const hiredTalent = await fetchHiredTalent(deliverableProps.mainId, deliverableProps.secondaryId);
      const deliverables = await fetchDeliverablesForHiredTalent(deliverableProps.mainId, deliverableProps.secondaryId);
      return { hiredTalent, deliverables };
    },
  });

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["hiredTalent", deliverableProps.mainId, deliverableProps.secondaryId] });
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
      fetchProfiles(data?.hiredTalent?.client || "", data?.hiredTalent?.freelancer || "");
    }
  }, [data, isLoading]);

  const getAvatarSrc = (role: "client" | "freelancer") => {
    const user = role === "client" ? clientProfile : freelancerProfile;
    return user && isImageUrl(user.profilePicture || "") ? user.profilePicture : "";
  };
  const client = {
    name: clientProfile?.username || data?.hiredTalent?.client || "Unknown",
    address: clientProfile?.address || data?.hiredTalent?.client || "Unknown",
    avatarSrc: getAvatarSrc("client") || undefined,
    role: "Client",
  };
  const freelancer = {
    name: freelancerProfile?.username || data?.hiredTalent?.freelancer || "Unknown",
    address: freelancerProfile?.address || data?.hiredTalent?.freelancer || "Unknown",
    avatarSrc: getAvatarSrc("freelancer") || undefined,
    role: "Freelancer",
  };
  const isClient = userAddress?.toLowerCase() === client?.address?.toLowerCase();
  const talentStatus = data?.hiredTalent?.state ?? null;
  const hireTalent = data?.hiredTalent ?? ({} as HiredTalent);

  const handleRejectJob = async (clientResponse: string) => {
    try {
      if (!hireTalent.hiredTalentId) return;
      showSpinner();
      const lastDeliverable = data?.deliverables && data.deliverables.length > 0 ? data.deliverables[0] : null;
      if (lastDeliverable?.resource) {
        const evidenceUri = await createEvidenceJSON(
          lastDeliverable.resource,
          "Rejected deliverable",
          `Deliverable rejected with the following reason: ${clientResponse}`,
        );
        await writeJobContract({
          functionName: "rejectHiredTalent",
          args: [BigInt(hireTalent.talentId), BigInt(hireTalent.hiredTalentId), clientResponse, evidenceUri],
        });
      }
      if (reload) await reload();
    } catch (err) {
      console.error("Reject job failed:", err);
    } finally {
      setShowDeliverableModal(false);
      hideSpinner();
    }
  };

  const handleClientConfirmCompletion = async (clientResponse: string) => {
    try {
      if (!hireTalent.hiredTalentId) return;
      showSpinner();
      await writeJobContract({
        functionName: "confirmClientCompletion",
        args: [BigInt(hireTalent.talentId), BigInt(hireTalent.hiredTalentId), clientResponse],
      });
      if (reload) await reload();
    } catch (err) {
      console.error("Confirm job completion failed:", err);
    } finally {
      setShowDeliverableModal(false);
      hideSpinner();
    }
  };

  const getActionButtons = (): React.ReactNode[] => {
    const buttons: React.ReactNode[] = [];
    if (
      isClient &&
      talentStatus === HiredTalentState.Ongoing &&
      hireTalent.freelancerDelivered &&
      !hireTalent.clientReceived
    ) {
      const firstDeliverable = data?.deliverables[0];
      if (firstDeliverable?.state === DeliverableState.Pending) {
        buttons.push(
          <Button
            variant="primary"
            key={`receive-0`}
            onClick={() => {
              setCurrentDeliverableIndex(0);
              setShowDeliverableModal(true);
            }}
            size="sm"
            tooltip="Review Deliverable"
            disabled={isMining}
          >
            <span>Review</span>
          </Button>,
        );
      }
    }
    return buttons;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-64">
        <Spinner />
      </div>
    );
  }

  const isDisputed =
    hireTalent.state === HiredTalentState.Disputed ||
    (hireTalent.state === HiredTalentState.Finished && !!hireTalent.disputeId);

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
          {data?.deliverables.map(deliverable => (
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
          onReject={handleRejectJob}
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
