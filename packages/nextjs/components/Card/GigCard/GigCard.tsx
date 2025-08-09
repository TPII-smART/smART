"use client";

import * as React from "react";
import { GigCardProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import Modal from "@/components/Modal/Modal";
import { queryClient } from "@/components/ScaffoldEthAppWithProviders";
import { EtherInput, InputBase } from "@/components/scaffold-eth";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { fetchApplicationsForGig } from "~~/services/graphql/fetchers/gig.service";
import { Application } from "~~/types/gig.types";

interface ApplicationsData {
  applications: Application[];
}

export function GigCard({ gig, className, reload, ...props }: GigCardProps) {
  const { address } = useAccount();
  const [showApplyModal, setShowApplyModal] = React.useState(false);
  const [showApplicationsModal, setShowApplicationsModal] = React.useState(false);
  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "GigsContract",
  });
  const [form, setForm] = React.useState({
    proposedPayment: "",
    proposedDurationInHours: "48",
    proposalComment: "",
  });
  const { data, isLoading, refetch } = useQuery<ApplicationsData>({
    queryKey: ["applicationsFromGig", gig.gigId],
    queryFn: () => fetchApplicationsForGig(gig.gigId),
  });

  const reloadApplications = async () => {
    queryClient.invalidateQueries({ queryKey: ["applicationsFromGig", gig.gigId] });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to ensure UI
    if (reload) await reload();
    await refetch();
  };

  React.useEffect(() => {
    if (showApplicationsModal) {
      reloadApplications();
    }
  }, [showApplicationsModal]);

  console.log("GigCard data:", data);

  const handleApplyToGig = async () => {
    try {
      await writeContractAsync({
        functionName: "applyToGig",
        args: [
          BigInt(gig.gigId),
          {
            proposedPayment: parseEther(form.proposedPayment),
            proposedDurationInHours: BigInt(form.proposedDurationInHours),
            proposal: form.proposalComment,
          },
        ],
      });
      if (reload) await reload();
      setShowApplyModal(false);
    } catch (err) {
      console.error("Create gig application failed:", err);
    }
  };

  const isMyOwnGig = gig?.client?.toLowerCase() === address?.toLowerCase();

  // Payment display with formatting and truncation
  const formatEthPrice = (wei: bigint) => {
    const eth = formatEther(wei);
    const num = parseFloat(eth);
    if (num === 0) return "Free";
    if (num < 0.001) return `${num.toFixed(6)} ETH`;
    if (num < 1) return `${num.toFixed(4)} ETH`;
    return `${num.toFixed(3)} ETH`;
  };

  const paymentDisplay = (
    <span
      className="text-lg font-bold cursor-help text-content-primary"
      title={gig?.maxPayment ? `${formatEther(BigInt(gig.maxPayment))} ETH` : "Free"}
    >
      {gig?.maxPayment ? formatEthPrice(BigInt(gig.maxPayment)) : "Free"}
    </span>
  );

  const truncateAddress = (address: string) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Apply button
  const applyButton = !isMyOwnGig ? (
    <Button variant="primary" onClick={() => setShowApplyModal(true)}>
      Apply
    </Button>
  ) : (
    <Button variant="outline" onClick={() => setShowApplicationsModal(true)}>
      View Applications
    </Button>
  );

  return (
    <>
      <UniversalCard
        avatarAddress={gig?.client}
        title={gig?.title}
        description={gig?.description}
        extraInfo={`Max work duration: ${gig?.maxDurationInHours} hours`}
        category={gig?.category}
        paymentDisplay={paymentDisplay}
        footerLeft={<div className="flex items-center gap-4">{paymentDisplay}</div>}
        footerRight={applyButton}
        className={className}
        {...props}
      />

      {/* Confirm Modal */}
      <Modal
        title="Hire this Freelancer"
        variant="form"
        onClose={() => setShowApplyModal(false)}
        onSubmit={handleApplyToGig}
        isOpen={showApplyModal}
        loading={isMining}
        description={
          form.proposedPayment === "" || form.proposedPayment === "0" || form.proposedPayment === undefined
            ? `You are about to apply to this gig for Free with a duration of ${form.proposedDurationInHours} hours.`
            : `You are about to apply to this gig with a proposed payment of ${form.proposedPayment} ETH and a duration of ${form.proposedDurationInHours} hours.`
        }
      >
        <div className="space-y-4">
          <EtherInput
            placeholder="Proposed Payment"
            value={form.proposedPayment}
            onChange={val => setForm({ ...form, proposedPayment: val })}
          />
          <InputBase
            placeholder="Proposed Duration (in hours)"
            value={form.proposedDurationInHours}
            onChange={val => setForm({ ...form, proposedDurationInHours: val })}
          />
          <InputBase
            placeholder="Proposal"
            value={form.proposalComment}
            onChange={val => setForm({ ...form, proposalComment: val })}
          />
        </div>
      </Modal>

      {/* Applications Modal */}
      <Modal
        title="Applications for this Gig"
        variant="custom"
        onClose={() => setShowApplicationsModal(false)}
        isOpen={showApplicationsModal}
        loading={isLoading}
        description="Here are the applications submitted for this gig."
      >
        {/* TODO: Use scrollable container and application components */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="text-center py-12">Loading applications...</div>
          ) : data?.applications && data.applications.length > 0 ? (
            <div className="space-y-3">
              {data.applications.map(application => (
                <div
                  key={application.applicationId}
                  className="p-4 border rounded-lg bg-secondary flex flex-col space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-bold">{truncateAddress(application.freelancer)}</h3>
                    <span className="text-sm font-medium">{formatEthPrice(BigInt(application.proposedPayment))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Duration: {application.proposedDurationInHours} hours</span>
                  </div>
                  {application.proposalComment && (
                    <div className="text-sm">
                      <span className="font-medium">Proposal: </span>
                      <span>{application.proposalComment}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">No applications found for this gig.</div>
          )}
        </div>
      </Modal>
    </>
  );
}
