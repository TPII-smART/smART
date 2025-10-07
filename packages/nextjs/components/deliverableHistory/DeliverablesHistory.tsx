"use client";

import { useEffect, useState } from "react";
import { DeliverableCard } from "../Card/DeliverableCard/DeliverableCard";
import { DeliverableHistoryProps, GigHistoryData, HistoryData, JobHistoryData } from "./types";
import Button from "@/components/Button/Button";
import { useQuery } from "@tanstack/react-query";
import { FunnelIcon } from "@heroicons/react/24/outline";
import { useUserProfile } from "~~/hooks/use-user-profile";
import { castDateToTimestamp, isImageUrl } from "~~/lib/utils";
import { fetchDeliverablesForGig, fetchGigById } from "~~/services/graphql/fetchers/gig/gig.service";
import { fetchDeliverablesForJob, fetchJob } from "~~/services/graphql/fetchers/job/job.service";
import { fetchUserProfile } from "~~/services/graphql/fetchers/profile.service";
import { Deliverable } from "~~/types/deliverable";
import { UserProfile } from "~~/types/user-profile.type";

// Mock data - replace with actual data fetching
const mockDeliverables = [
  {
    id: "1",
    fileName: "Project_Proposal_Final.pdf",
    fileType: "pdf",
    fileUrl: "/pdf-document-preview.png",
    isIPFS: false,
    ipfsHash: null,
    sender: {
      name: "Sarah Chen",
      avatar: "/diverse-woman-avatar.png",
      role: "Creative Director",
    },
    senderComment:
      "Here's the final version of the project proposal. I've incorporated all the feedback from last week's meeting and updated the timeline section.",
    timestamp: "2024-01-15T10:30:00Z",
    receiver: {
      name: "Michael Torres",
      avatar: "/man-avatar.png",
      role: "Project Manager",
    },
    receiverResponse: "Looks great! The timeline adjustments are perfect. Approved for client presentation.",
    responseTimestamp: "2024-01-15T14:20:00Z",
  },
  {
    id: "2",
    fileName: "Design_Mockups_v3.fig",
    fileType: "figma",
    fileUrl: "/figma-design-mockup.png",
    isIPFS: true,
    ipfsHash: "QmX7Kd9fH3jN2pL8mR4vT6wY9zB1cE5gH8iJ0kL2mN3oP4",
    sender: {
      name: "Alex Rivera",
      avatar: "/diverse-person-avatars.png",
      role: "UI/UX Designer",
    },
    senderComment:
      "Updated mockups with the new color palette and typography. Also added mobile responsive views for all screens.",
    timestamp: "2024-01-14T16:45:00Z",
    receiver: null,
    receiverResponse: null,
    responseTimestamp: null,
  },
  {
    id: "3",
    fileName: "Q4_Analytics_Report.xlsx",
    fileType: "excel",
    fileUrl: "/spreadsheet-data.png",
    isIPFS: false,
    ipfsHash: null,
    sender: {
      name: "Jessica Park",
      avatar: "/professional-woman-avatar.png",
      role: "Data Analyst",
    },
    senderComment:
      "Complete Q4 analytics with performance metrics, user engagement data, and growth projections for next quarter.",
    timestamp: "2024-01-13T09:15:00Z",
    receiver: {
      name: "David Kim",
      avatar: "/man-avatar-business.jpg",
      role: "VP of Operations",
    },
    receiverResponse:
      "Thanks for the detailed breakdown. Can you add a comparison with Q3 data? Would help with the board presentation.",
    responseTimestamp: "2024-01-13T11:30:00Z",
  },
  {
    id: "4",
    fileName: "Brand_Guidelines_2024.pdf",
    fileType: "pdf",
    fileUrl: "/brand-guidelines-document.jpg",
    isIPFS: true,
    ipfsHash: "QmY8Le0eG4kO3qM9sU7xW0aD2fF6hI9jK1lM3nO4pQ5rS6",
    sender: {
      name: "Emma Watson",
      avatar: "/woman-avatar-creative.jpg",
      role: "Brand Manager",
    },
    senderComment:
      "New brand guidelines for 2024. Includes updated logo usage, color systems, and typography standards.",
    timestamp: "2024-01-12T13:00:00Z",
    receiver: null,
    receiverResponse: null,
    responseTimestamp: null,
  },
];

export function DeliverablesHistory(deliverableProps: DeliverableHistoryProps) {
  // Information related to the users (client and freelancer)
  const [clientProfile, setClientProfile] = useState<UserProfile | null>(null);
  const [freelancerProfile, setFreelancerProfile] = useState<UserProfile | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "responded">("all");

  const filteredDeliverables = mockDeliverables.filter(deliverable => {
    if (filter === "pending") return !deliverable.receiverResponse;
    if (filter === "responded") return !!deliverable.receiverResponse;
    return true;
  });

  const { data, isLoading, error, refetch } = useQuery<HistoryData>({
    queryKey: [deliverableProps.type, deliverableProps.mainId, deliverableProps.secondaryId],
    queryFn: async () => {
      if (deliverableProps.type === "job") {
        const job = await fetchJob(deliverableProps.mainId, deliverableProps.secondaryId);
        const deliverables = await fetchDeliverablesForJob(deliverableProps.mainId, deliverableProps.secondaryId);
        return { job, deliverables };
      } else {
        const gig = await fetchGigById(deliverableProps.mainId);
        const deliverables = await fetchDeliverablesForGig(deliverableProps.mainId);
        // Ensure gig contains all required properties for type Gig
        return { gig, deliverables };
      }
    },
  });

  console.log("Deliverables Data:", data);

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
      if (deliverableProps.type === "job" && "job" in data) {
        console;
        fetchProfiles(data?.job?.client || "", data?.job?.freelancer || "");
      } else if (deliverableProps.type === "gig" && "gig" in data) {
        fetchProfiles(data?.gig?.client || "", data?.gig?.acceptedFreelancer || "");
      }
    }
  }, [data, isLoading]);

  const getAvatarSrc = (role: "client" | "freelancer") => {
    const user = role === "client" ? clientProfile : freelancerProfile;
    return user && isImageUrl(user.profilePicture || "") ? user.profilePicture : "";
  };

  // Normaliza los entregables según el tipo
  // const normalizedDeliverables: DeliverableInfo[] = (data?.deliverables || []).map(d => {
  //   if (deliverableProps.type === "job" && "job" in (data || {})) {
  //     return {
  //       fileName: "test",
  //       fileType: "pdf",
  //       isLink: d.isLink,
  //       resource: d.resource,
  //       sender: {
  //         name: freelancerProfile?.username,
  //         role: "Freelancer",
  //         avatarSrc: getAvatarSrc("freelancer"),
  //       },
  //       senderComment: d.submissionComment,
  //       timestamp: d.uploadedAt,
  //       receiver: {
  //         name: clientProfile?.username,
  //         avatarSrc: getAvatarSrc("client"),
  //         role: "Client",
  //       },
  //       receiverResponse: d.clientResponse,
  //       responseTimestamp: d.responseTimestamp,
  //     };
  //   }
  //   if (deliverableProps.type === "gig" && "gig" in (data || {})) {
  //     return {
  //       fileName: "test",
  //       fileType: "pdf",
  //       isLink: d.isLink,
  //       resource: d.resource,
  //       sender: {
  //         name: freelancerProfile?.username,
  //         role: "Freelancer",
  //         avatarSrc: getAvatarSrc("freelancer"),
  //       },
  //       senderComment: d.submissionComment,
  //       timestamp: d.uploadedAt,
  //       receiver: {
  //         name: clientProfile?.username,
  //         avatarSrc: getAvatarSrc("client"),
  //         role: "Client",
  //       },
  //       receiverResponse: d.clientResponse,
  //       responseTimestamp: d.responseTimestamp,
  //     };
  //   }
  //   // fallback: si no hay job/gig, retorna null para filtrar después
  //   return null;
  // });

  const client = {
    name:
      clientProfile?.username ||
      ("job" in (data ?? {}) ? (data as JobHistoryData).job?.client : undefined) ||
      ("gig" in (data ?? {}) ? (data as GigHistoryData).gig?.client : undefined) ||
      "Unknown",
    address:
      clientProfile?.address ||
      ("job" in (data ?? {}) ? (data as JobHistoryData).job?.client : undefined) ||
      ("gig" in (data ?? {}) ? (data as GigHistoryData).gig?.client : undefined) ||
      "Unknown",
    avatarSrc: getAvatarSrc("client") || undefined,
    role: "Client",
  };
  const freelancer = {
    name:
      freelancerProfile?.username ||
      ("job" in (data ?? {}) ? (data as JobHistoryData).job?.freelancer : undefined) ||
      ("gig" in (data ?? {}) ? (data as GigHistoryData).gig?.acceptedFreelancer : undefined) ||
      "Unknown",
    address:
      freelancerProfile?.address ||
      ("job" in (data ?? {}) ? (data as JobHistoryData).job?.freelancer : undefined) ||
      ("gig" in (data ?? {}) ? (data as GigHistoryData).gig?.acceptedFreelancer : undefined) ||
      "Unknown",
    avatarSrc: getAvatarSrc("freelancer") || undefined,
    role: "Freelancer",
  };
  return (
    <div className="h-full flex flex-col px-8 py-4 space-y-4 mx-5">
      {/* Header */}
      <div className="mb-8 ">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-4xl font-bold text-balance">Deliverables History</h1>
        </div>
        <p className="text-muted-foreground text-lg">Track all project submissions and feedback in one place</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 ">
        <FunnelIcon className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2">
          <Button variant={filter === "all" ? "primary" : "outline"} size="sm" onClick={() => setFilter("all")}>
            All ({mockDeliverables.length})
          </Button>
          <Button variant={filter === "pending" ? "primary" : "outline"} size="sm" onClick={() => setFilter("pending")}>
            Pending Response ({mockDeliverables.filter(d => !d.receiverResponse).length})
          </Button>
          <Button
            variant={filter === "responded" ? "primary" : "outline"}
            size="sm"
            onClick={() => setFilter("responded")}
          >
            Responded ({mockDeliverables.filter(d => d.receiverResponse).length})
          </Button>
        </div>
      </div>

      {/* Timeline */}
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
            />
          ))}
        </div>
      </div>
      <div>
        {filteredDeliverables.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No deliverables found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
