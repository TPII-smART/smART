"use client";

import { useState } from "react";
import { DeliverableCard } from "./Card/DeliverableCard/DeliverableCard";
import Button from "@/components/Button/Button";
import { DocumentTextIcon, FunnelIcon } from "@heroicons/react/24/outline";

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

export function DeliverablesHistory() {
  const [filter, setFilter] = useState<"all" | "pending" | "responded">("all");

  const filteredDeliverables = mockDeliverables.filter(deliverable => {
    if (filter === "pending") return !deliverable.receiverResponse;
    if (filter === "responded") return !!deliverable.receiverResponse;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <DocumentTextIcon className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold text-balance">Deliverables History</h1>
        </div>
        <p className="text-muted-foreground text-lg">Track all project submissions and feedback in one place</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
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
      <div className="space-y-6">
        {filteredDeliverables.map(deliverable => (
          <DeliverableCard key={deliverable.id} deliverable={deliverable} />
        ))}
      </div>

      {filteredDeliverables.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No deliverables found for this filter.</p>
        </div>
      )}
    </div>
  );
}
