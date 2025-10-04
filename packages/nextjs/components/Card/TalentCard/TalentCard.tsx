"use client";

import * as React from "react";
import { TalentCardProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import { DurationInput, InputBase } from "@/components/scaffold-eth";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import * as Yup from "yup";
import Button from "~~/components/Button/Button";
import FormModal from "~~/components/Modal/FormModal/FormModal";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { waitTransaction } from "~~/lib/waitTransaction.util";

class TalentFormData {
  title: string;
  description: string;
  hiredTalentHours: string;

  constructor() {
    this.title = "";
    this.description = "";
    this.hiredTalentHours = "";
  }
}

export function TalentCard({ talent, className, reload, ...props }: TalentCardProps) {
  const { address } = useAccount();
  const [showModal, setShowModal] = React.useState(false);
  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "HiredTalentsContract",
  });

  const handleCreateHiredTalent = async (form: TalentFormData) => {
    try {
      if (!talent?.basePayment || !talent?.talentId) return;
      const transactionHash = await writeContractAsync({
        functionName: "createHiredTalent",
        args: [
          BigInt(talent?.talentId),
          {
            title: form.title,
            description: form.description,
            payment: BigInt(talent?.basePayment),
            durationInHours: BigInt(form.hiredTalentHours),
          },
        ],
        value: BigInt(talent?.basePayment),
      });
      await waitTransaction("hiredTalent", transactionHash);
      await reload?.();

      setShowModal(false);
    } catch (err) {
      console.error("Create hiredTalent failed:", err);
    }
  };

  const isMyOwnHiredTalent = talent?.freelancer?.toLowerCase() === address?.toLowerCase();

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
      title={talent?.basePayment ? `${formatEther(BigInt(talent.basePayment))} ETH` : "Free"}
    >
      {talent?.basePayment ? formatEthPrice(BigInt(talent.basePayment)) : "Free"}
    </span>
  );

  // Hire button
  const hireButton = !isMyOwnHiredTalent ? (
    <Button variant="primary" onClick={() => setShowModal(true)}>
      Hire
    </Button>
  ) : (
    <Button variant="outline" onClick={() => (window.location.href = `/talents/${talent?.talentId}`)}>
      Details
    </Button>
  );

  // Validation schema for the form fields using yup

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required").max(64, "Title must be at most 64 characters"),
    description: Yup.string()
      .required("Description is required")
      .max(512, "Description must be at most 512 characters"),
    hiredTalentHours: Yup.number()
      .typeError("HiredTalent duration must be a number")
      .integer("HiredTalent duration must be an integer")
      .positive("HiredTalent duration must be a positive integer")
      .required("HiredTalent duration is required"),
  });

  return (
    <>
      <UniversalCard
        bannerUrl={talent?.bannerImageHash}
        avatarAddress={talent?.freelancer}
        title={talent?.title}
        description={talent?.description}
        time={talent?.averageWorkDuration}
        timeLabel="Average work duration"
        category={talent?.category}
        rating={talent?.rating ? talent.rating : 0}
        paymentDisplay={paymentDisplay}
        footerLeft={<div className="flex items-center gap-4">{paymentDisplay}</div>}
        footerRight={hireButton}
        className={className}
        {...props}
      />

      {/* Confirm Modal */}
      <FormModal
        modalProps={{
          title: "Hire this Freelancer",
          onClose: () => setShowModal(false),
          isOpen: showModal,
          loading: isMining,
          description: `
            You are about to create a hire based on this talent. 
            The price will be deducted from your wallet: 
            ${talent?.basePayment ? `${formatEther(BigInt(talent.basePayment))} ETH` : "Free"}
          `,
        }}
        formikProps={{
          onSubmit: handleCreateHiredTalent,
          initialValues: new TalentFormData(),
          validationSchema,
        }}
      >
        {({ values, setFieldValue, touched, errors }) => (
          <div className="space-y-4">
            <InputBase
              placeholder="Title"
              value={values.title}
              onChange={val => setFieldValue("title", val)}
              error={touched.title && !!errors.title}
              helperText={touched.title && errors.title ? errors.title : ""}
            />
            <InputBase
              multiline
              minRows={4}
              placeholder="Description"
              value={values.description}
              onChange={val => setFieldValue("description", val)}
              error={touched.description && !!errors.description}
              helperText={touched.description && errors.description ? errors.description : ""}
            />
            <DurationInput
              placeholder="Hire Duration"
              value={values.hiredTalentHours}
              onChange={val => setFieldValue("hiredTalentHours", val)}
              error={touched.hiredTalentHours && !!errors.hiredTalentHours}
              helperText={touched.hiredTalentHours && errors.hiredTalentHours ? errors.hiredTalentHours : ""}
            />
          </div>
        )}
      </FormModal>
    </>
  );
}
