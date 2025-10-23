"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DisputeStatus, Ruling, useDisputeContracts } from "./../../hooks/use-dispute-contracts";
import { DisputeCard } from "@/components/Card/DisputeCard/DisputeCard";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useGlobalSpinner } from "~~/context/SpinnerProvider";
import {
  fetchAppelableDisputes,
  fetchDisputesWithContributors,
} from "~~/services/graphql/fetchers/dispute/dispute.service";
import { Dispute } from "~~/types/dispute/dispute.type";

// Mock data - replace with real data from your API
const mockDisputes = [
  {
    disputeId: 1,
    arbiterDisputeId: 101,
    title: "Payment Dispute - Logo Design Project",
    description:
      "Client claims the logo design does not meet the agreed specifications and refuses to pay the full amount.",
    disputeReason:
      "The delivered logo design does not match the color scheme and style guidelines specified in the original contract. Client refuses final payment until revisions are made.",
    raiseOnKleros: false,
    freelancerPaidArbitrationFee: true,
    clientPaidArbitrationFee: false,
    disputeDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    currentRound: 2,
    currentRuling: 0,
    freelancerFunds: "500000000000000000", // 0.5 ETH en wei
    clientFunds: "0",
    appealCost: "100000000000000000", // 0.1 ETH en wei
    status: 1,
    contributors: ["0x1234...5678", "0xabcd...efgh"],
    disputeFinished: false,
  },
  {
    disputeId: 2,
    arbiterDisputeId: 102,
    title: "Scope Disagreement - Web Development",
    description: "Dispute over additional features requested after the initial scope was agreed upon.",
    disputeReason:
      "Client requested integration with 3 additional payment gateways and a custom analytics dashboard after the project scope was finalized. Freelancer claims this constitutes additional work beyond the original agreement.",
    raiseOnKleros: true,
    freelancerPaidArbitrationFee: true,
    clientPaidArbitrationFee: true,
    disputeDeadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    currentRound: 1,
    currentRuling: 1,
    freelancerFunds: "1200000000000000000", // 1.2 ETH en wei
    clientFunds: "800000000000000000", // 0.8 ETH en wei
    appealCost: "250000000000000000", // 0.25 ETH en wei
    status: 1,
    contributors: ["0x2345...6789", "0xbcde...fghi", "0xcdef...ghij"],
    disputeFinished: false,
  },
  {
    disputeId: 3,
    arbiterDisputeId: 103,
    title: "Quality Issues - Content Writing",
    description: "Client disputes the quality of delivered content and requests revisions without additional payment.",
    disputeReason:
      "Content contains multiple grammatical errors and does not align with the brand voice guidelines provided. Client is requesting unlimited revisions which were not part of the original scope (max 2 revisions agreed).",
    raiseOnKleros: false,
    freelancerPaidArbitrationFee: true,
    clientPaidArbitrationFee: true,
    disputeDeadline: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    currentRound: 3,
    currentRuling: 2,
    freelancerFunds: "450000000000000000", // 0.45 ETH en wei
    clientFunds: "300000000000000000", // 0.3 ETH en wei
    appealCost: "150000000000000000", // 0.15 ETH en wei
    status: 2, // urgent
    contributors: ["0x3456...789a", "0xcdef...ghij"],
    disputeFinished: false,
  },
  {
    disputeId: 4,
    arbiterDisputeId: 104,
    title: "Delivery Delay - Graphic Design",
    description: "Project was delivered 2 weeks late, client requesting compensation for the delay.",
    disputeReason:
      "Freelancer missed the agreed deadline by 14 days without prior communication. Client had a product launch scheduled and incurred additional marketing costs due to the delay. Requesting 30% compensation for damages.",
    raiseOnKleros: false,
    freelancerPaidArbitrationFee: true,
    clientPaidArbitrationFee: true,
    disputeDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    currentRound: 1,
    currentRuling: 0,
    freelancerFunds: "600000000000000000", // 0.6 ETH en wei
    clientFunds: "600000000000000000", // 0.6 ETH en wei
    appealCost: "200000000000000000", // 0.2 ETH en wei
    status: 1,
    contributors: ["0x4567...89ab", "0xdefg...hijk"],
    disputeFinished: false,
  },
  {
    disputeId: 5,
    arbiterDisputeId: 105,
    title: "Intellectual Property Claim - Mobile App UI",
    description: "Client claims ownership of design assets created during the project development phase.",
    disputeReason:
      "Freelancer delivered UI designs but is claiming copyright ownership and refusing to transfer IP rights. Contract terms regarding IP transfer are ambiguous. Client cannot proceed with app development without clear ownership.",
    raiseOnKleros: true,
    freelancerPaidArbitrationFee: true,
    clientPaidArbitrationFee: false,
    disputeDeadline: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    currentRound: 1,
    currentRuling: 1,
    freelancerFunds: "1500000000000000000", // 1.5 ETH en wei
    clientFunds: "500000000000000000", // 0.5 ETH en wei
    appealCost: "300000000000000000", // 0.3 ETH en wei
    status: 1,
    contributors: ["0x5678...9abc", "0xefgh...ijkl", "0xfghi...jklm"],
    disputeFinished: false,
  },
  {
    disputeId: 6,
    arbiterDisputeId: 106,
    title: "Incomplete Work - Backend Development",
    description: "Project delivered with critical bugs and missing core functionality.",
    disputeReason:
      "Backend API is missing authentication endpoints and has security vulnerabilities. Database queries are not optimized causing severe performance issues. Client claims work is only 60% complete despite full payment being requested.",
    raiseOnKleros: false,
    freelancerPaidArbitrationFee: false,
    clientPaidArbitrationFee: true,
    disputeDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    currentRound: 2,
    currentRuling: 2,
    freelancerFunds: "0",
    clientFunds: "3000000000000000000", // 3 ETH en wei
    appealCost: "500000000000000000", // 0.5 ETH en wei
    status: 2,
    contributors: ["0x6789...abcd", "0xghij...klmn"],
    disputeFinished: false,
  },
];
export default function DisputesPage() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { showSpinner, hideSpinner } = useGlobalSpinner();

  const { data, isLoading, error, refetch } = useQuery<Dispute[]>({
    queryKey: ["Dispute"],
    queryFn: () => fetchDisputesWithContributors(),
  });

  console.log("Disputes data:", data);

  const reload = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ["Dispute"] });
    await new Promise(resolve => setTimeout(resolve, 1000));
    await refetch();
  }, [queryClient, refetch]);

  return (
    <div className="h-full pb-30 bg-background">
      {/* Header */}
      <div className="">
        <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Disputes</h1>
              <p className="mt-2 text-muted-foreground">Manage and resolve active disputes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Disputes Grid */}
      <div className="mx-auto px-4 py-12 sm:px-6 lg:px-8 overflow-y-auto h-full">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {data?.map(dispute => (
            <DisputeCard key={dispute.disputeId} dispute={dispute} />
          ))}
        </div>

        {/* Empty State */}
        {mockDisputes.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-border bg-card/50 py-12">
            <p className="text-lg text-muted-foreground">No disputes found</p>
            <p className="mt-1 text-sm text-muted-foreground">All your projects are running smoothly!</p>
          </div>
        )}
      </div>
    </div>
  );
}
