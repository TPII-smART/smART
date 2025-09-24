"use client";

import * as React from "react";
import { GigCardProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import { EtherInput, InputBase, IntegerInput } from "@/components/scaffold-eth";
import { GigState } from "@se-2/common";
import { formatEther } from "viem";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import * as Yup from "yup";
import Button from "~~/components/Button/Button";
import FormModal from "~~/components/Modal/FormModal/FormModal";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { waitTransaction } from "~~/lib/waitTransaction.util";

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
      const transactionHash = await writeContractAsync({
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

      await waitTransaction("gigApplication", transactionHash);
      await reload?.();
      setShowApplyModal(false);
    } catch (err) {
      console.error("Create gig application failed:", err);
    }
  };

  const isMyOwnGig = gig?.client?.toLowerCase() === address?.toLowerCase();

  const gigState = gig?.state as GigState;

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

  const navigateToGigDetails = () => {
    if (gig?.acceptedApplicationId && gigState == GigState.Open) {
      window.location.href = `/gig/${gig?.gigId}?applicationId=${gig.acceptedApplicationId || ""} `;
    } else {
      window.location.href = `/gig/${gig?.gigId}`;
    }
  };

  // Apply button
  const applyButton =
    !isMyOwnGig && gigState === GigState.Open ? (
      !gig.userApplication ? (
        <Button variant="primary" onClick={() => setShowApplyModal(true)}>
          Apply
        </Button>
      ) : (
        <Button variant="outline" onClick={() => (window.location.href = `/gig/${gig?.gigId}/${gig.userApplication}`)}>
          My Application
        </Button>
      )
    ) : (
      <Button variant="outline" onClick={() => navigateToGigDetails()}>
        Details
      </Button>
    );

  const validationSchema = Yup.object().shape({
    proposedPayment: Yup.number().positive().required("Proposed payment is required"),
    proposedDurationInHours: Yup.number().positive().required("Duration is required").integer("Must be a whole number"),
    proposalComment: Yup.string().required("Proposal comment is required").max(512, "Maximum 512 characters"),
  });

  return (
    <>
      <UniversalCard
        bannerUrl={gig?.gigBannerImageHash ? gig.gigBannerImageHash : undefined}
        avatarAddress={gig?.client}
        title={gig?.title}
        description={gig?.description}
        time={gig?.maxDurationInHours}
        timeLabel="Work duration"
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
          title: "Apply to this Gig",
          description: `You are applying to the gig: "${gig?.title}". Base payment of ${
            gig?.basePayment ? formatEthPrice(BigInt(gig.basePayment)) : "Free"
          } and base duration of ${gig?.maxDurationInHours} hours.`,
          onClose: () => setShowApplyModal(false),
          isOpen: showApplyModal,
          loading: isMining,
        }}
        formikProps={{
          initialValues: new FormData(),
          onSubmit: handleApplyToGig,
          validationSchema,
        }}
      >
        {({ values, setFieldValue, errors, touched }) => (
          <div className="space-y-4">
            <EtherInput
              placeholder="Proposed Payment"
              value={values.proposedPayment}
              onChange={val => setFieldValue("proposedPayment", val)}
              error={touched.proposedPayment && !!errors.proposedPayment}
              helperText={touched.proposedPayment && errors.proposedPayment ? errors.proposedPayment : ""}
            />
            <IntegerInput
              placeholder="Proposed Duration (in hours)"
              value={values.proposedDurationInHours}
              onChange={val => setFieldValue("proposedDurationInHours", val)}
              error={touched.proposedDurationInHours && !!errors.proposedDurationInHours}
              helperText={
                touched.proposedDurationInHours && errors.proposedDurationInHours ? errors.proposedDurationInHours : ""
              }
              disableMultiplyBy1e18
            />
            <InputBase
              placeholder="Proposal"
              value={values.proposalComment}
              onChange={val => setFieldValue("proposalComment", val)}
              error={touched.proposalComment && !!errors.proposalComment}
              helperText={touched.proposalComment && errors.proposalComment ? errors.proposalComment : ""}
            />
          </div>
        )}
      </FormModal>
    </>
  );
}
