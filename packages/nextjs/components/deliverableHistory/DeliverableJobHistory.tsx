import { useEffect, useState } from "react";
import { DeliverableCard } from "../Card/DeliverableCard/DeliverableCard";
import { queryClient } from "../ScaffoldEthAppWithProviders";
import { DeliverableHistoryProps } from "./types";
import Button from "@/components/Button/Button";
import { DeliverableState, JobState } from "@se-2/common";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import DeliverableReviewModal from "~~/components/DeliverableReviewModal/DeliverableReviewModal";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { castDateToTimestamp, isImageUrl } from "~~/lib/utils";
import { fetchDeliverablesForJob, fetchJob } from "~~/services/graphql/fetchers/job/job.service";
import { fetchUserProfile } from "~~/services/graphql/fetchers/profile.service";
import { Job } from "~~/types/job";
import { UserProfile } from "~~/types/user-profile.type";

export function DeliverableJobHistory(deliverableProps: DeliverableHistoryProps) {
  const [currentDeliverableIndex, setCurrentDeliverableIndex] = useState<number | null>(null);
  const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<UserProfile | null>(null);
  const [showDeliverableModal, setShowDeliverableModal] = useState(false);
  const { address: userAddress } = useAccount();
  const { writeContractAsync: writeJobContract } = useScaffoldWriteContract({ contractName: "JobsContract" });
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["job", deliverableProps.mainId, deliverableProps.secondaryId],
    queryFn: async () => {
      const job = await fetchJob(deliverableProps.mainId, deliverableProps.secondaryId);
      const deliverables = await fetchDeliverablesForJob(deliverableProps.mainId, deliverableProps.secondaryId);
      return { job, deliverables };
    },
  });

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["job", deliverableProps.mainId, deliverableProps.secondaryId] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
  };

  useEffect(() => {
    const fetchProfiles = async (client: string, freelancer: string) => {
      if (client) {
        try {
          const profile = await fetchUserProfile(client);
          setClientProfile(profile);
        } catch (error) {}
      }
      if (freelancer) {
        try {
          const profile = await fetchUserProfile(freelancer);
          setFreelancerProfile(profile);
        } catch (error) {}
      }
    };
    if (data) {
      fetchProfiles(data?.job?.client || "", data?.job?.freelancer || "");
    }
  }, [data, isLoading]);

  const getAvatarSrc = (role: "client" | "freelancer") => {
    const user = role === "client" ? clientProfile : freelancerProfile;
    return user && isImageUrl(user.profilePicture || "") ? user.profilePicture : "";
  };
  const client = {
    name: clientProfile?.username || data?.job?.client || "Unknown",
    address: clientProfile?.address || data?.job?.client || "Unknown",
    avatarSrc: getAvatarSrc("client") || undefined,
    role: "Client",
  };
  const freelancer = {
    name: freelancerProfile?.username || data?.job?.freelancer || "Unknown",
    address: freelancerProfile?.address || data?.job?.freelancer || "Unknown",
    avatarSrc: getAvatarSrc("freelancer") || undefined,
    role: "Freelancer",
  };
  const isClient = userAddress?.toLowerCase() === client?.address?.toLowerCase();
  const jobStatus = data?.job?.state ?? null;
  const job = data?.job ?? ({} as Job);

  const handleRejectJob = async (clientResponse: string) => {
    try {
      if (!job.jobId) return;
      await writeJobContract({
        functionName: "rejectJob",
        args: [BigInt(job.postingId), BigInt(job.jobId), clientResponse],
      });
      if (reload) await reload();
    } catch (err) {
    } finally {
      setShowDeliverableModal(false);
    }
  };

  const handleClientConfirmCompletion = async (clientResponse: string) => {
    try {
      await writeJobContract({
        functionName: "confirmClientCompletion",
        args: [BigInt(job.postingId), BigInt(job.jobId), clientResponse],
      });
      if (reload) await reload();
    } catch (err) {
    } finally {
      setShowDeliverableModal(false);
    }
  };

  const getActionButtons = (): React.ReactNode[] => {
    const buttons: React.ReactNode[] = [];
    if (isClient && jobStatus === JobState.Ongoing && job.freelancerDelivered && !job.clientReceived) {
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
          >
            <span>Review</span>
          </Button>,
        );
      }
    }
    return buttons;
  };

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
          {data?.deliverables.map((deliverable, idx) => (
            <DeliverableCard
              key={`${deliverable.resource}-${deliverable.uploadedAt}`}
              deliverable={{
                ...deliverable,
                uploadedAt: castDateToTimestamp(deliverable.uploadedAt),
                responseTimestamp: castDateToTimestamp(deliverable.responseTimestamp),
              }}
              client={client}
              freelancer={freelancer}
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
          loading={false}
          showFullInfo={false}
          resource={data.deliverables[currentDeliverableIndex].resource}
          isLink={data.deliverables[currentDeliverableIndex].isLink}
          modalTitle="Review Deliverable"
          modalDescription="Please review the deliverable and provide your feedback."
        />
      )}
    </div>
  );
}
