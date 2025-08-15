"use client";

import * as React from "react";
import { GigCardProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import { EtherInput, InputBase } from "@/components/scaffold-eth";
import { formatEther } from "viem";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import FormModal from "~~/components/Modal/FormModal/FormModal";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

class FormData {
  proposedPayment: string;
  proposedDurationInHours: string;
  proposalComment: string;

  constructor() {
    this.proposedPayment = "";
    this.proposedDurationInHours = "48"; // Default to 48 hours
    this.proposalComment = "";
  }
}

export function GigCard({ gig, className, reload, ...props }: GigCardProps) {
  const { address } = useAccount();
  const [showApplyModal, setShowApplyModal] = React.useState(false);
  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "GigsContract",
  });

  const handleApplyToGig = async (form: FormData) => {
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
      <FormModal
        modalProps={{
          title: "Hire this Freelancer",
          onClose: () => setShowApplyModal(false),
          isOpen: showApplyModal,
          loading: isMining,
        }}
        formikProps={{
          initialValues: new FormData(),
          onSubmit: handleApplyToGig,
        }}
      >
        {({ values, setFieldValue }) => (
          <div className="space-y-4">
            <EtherInput
              placeholder="Proposed Payment"
              value={values.proposedPayment}
              onChange={val => setFieldValue("proposedPayment", val)}
            />
            <InputBase
              placeholder="Proposed Duration (in hours)"
              value={values.proposedDurationInHours}
              onChange={val => setFieldValue("proposedDurationInHours", val)}
            />
            <InputBase
              placeholder="Proposal"
              value={values.proposalComment}
              onChange={val => setFieldValue("proposalComment", val)}
            />
          </div>
        )}
      </FormModal>
    </>
  );
}
