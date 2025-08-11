"use client";

import * as React from "react";
import { GigCardProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import Modal from "@/components/Modal/Modal";
import { EtherInput, InputBase } from "@/components/scaffold-eth";
import { formatEther } from "viem";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export function GigCard({ gig, className, reload, ...props }: GigCardProps) {
  const { address } = useAccount();
  const [showApplyModal, setShowApplyModal] = React.useState(false);
  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "GigsContract",
  });
  const [form, setForm] = React.useState({
    proposedPayment: "",
    proposedDurationInHours: "48",
    proposalComment: "",
  });

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
      title={gig?.basePayment ? `${formatEther(BigInt(gig.basePayment))} ETH` : "Free"}
    >
      {gig?.basePayment ? formatEthPrice(BigInt(gig.basePayment)) : "Free"}
    </span>
  );

  // Apply button
  const applyButton = !isMyOwnGig ? (
    <Button variant="primary" onClick={() => setShowApplyModal(true)}>
      Apply
    </Button>
  ) : (
    <Button variant="outline" onClick={() => (window.location.href = `/gig/${gig?.gigId}`)}>
      Details
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
    </>
  );
}
