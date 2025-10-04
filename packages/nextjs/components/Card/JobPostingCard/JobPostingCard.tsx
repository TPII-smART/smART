"use client";

import * as React from "react";
import { JobPostingCardProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import { DurationInput, InputBase } from "@/components/scaffold-eth";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import * as Yup from "yup";
import Button from "~~/components/Button/Button";
import FormModal from "~~/components/Modal/FormModal/FormModal";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { waitTransaction } from "~~/lib/waitTransaction.util";

class PostingFormData {
  title: string;
  description: string;
  jobHours: string;

  constructor() {
    this.title = "";
    this.description = "";
    this.jobHours = "";
  }
}

export function JobPostingCard({ jobPosting, className, reload, ...props }: JobPostingCardProps) {
  const { address } = useAccount();
  const [showModal, setShowModal] = React.useState(false);
  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  const handleCreateJob = async (form: PostingFormData) => {
    try {
      if (!jobPosting?.basePayment || !jobPosting?.postingId) return;
      const transactionHash = await writeContractAsync({
        functionName: "createJob",
        args: [
          BigInt(jobPosting?.postingId),
          {
            title: form.title,
            description: form.description,
            payment: BigInt(jobPosting?.basePayment),
            durationInHours: BigInt(form.jobHours),
          },
        ],
        value: BigInt(jobPosting?.basePayment),
      });
      await waitTransaction("job", transactionHash);
      await reload?.();

      setShowModal(false);
    } catch (err) {
      console.error("Create job failed:", err);
    }
  };

  const isMyOwnJob = jobPosting?.freelancer?.toLowerCase() === address?.toLowerCase();

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
      title={jobPosting?.basePayment ? `${formatEther(BigInt(jobPosting.basePayment))} ETH` : "Free"}
    >
      {jobPosting?.basePayment ? formatEthPrice(BigInt(jobPosting.basePayment)) : "Free"}
    </span>
  );

  // Hire button
  const hireButton = !isMyOwnJob ? (
    <Button variant="primary" onClick={() => setShowModal(true)}>
      Hire
    </Button>
  ) : (
    <Button variant="outline" onClick={() => (window.location.href = `/job-posting/${jobPosting?.postingId}`)}>
      Details
    </Button>
  );

  // Validation schema for the form fields using yup

  const validationSchema = Yup.object().shape({
    title: Yup.string().required("Title is required").max(64, "Title must be at most 64 characters"),
    description: Yup.string()
      .required("Description is required")
      .max(512, "Description must be at most 512 characters"),
    jobHours: Yup.number()
      .typeError("Job duration must be a number")
      .integer("Job duration must be an integer")
      .positive("Job duration must be a positive integer")
      .required("Job duration is required"),
  });

  return (
    <>
      <UniversalCard
        bannerUrl={jobPosting?.bannerImageHash}
        avatarAddress={jobPosting?.freelancer}
        title={jobPosting?.title}
        description={jobPosting?.description}
        time={jobPosting?.averageWorkDuration}
        timeLabel="Average work duration"
        category={jobPosting?.category}
        rating={jobPosting?.rating ? jobPosting.rating : 0}
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
            You are about to create a job based on this posting. 
            The price will be deducted from your wallet: 
            ${jobPosting?.basePayment ? `${formatEther(BigInt(jobPosting.basePayment))} ETH` : "Free"}
          `,
        }}
        formikProps={{
          onSubmit: handleCreateJob,
          initialValues: new PostingFormData(),
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
              placeholder="Description"
              value={values.description}
              onChange={val => setFieldValue("description", val)}
              error={touched.description && !!errors.description}
              helperText={touched.description && errors.description ? errors.description : ""}
            />
            <DurationInput
              placeholder="Job Duration"
              value={values.jobHours}
              onChange={val => setFieldValue("jobHours", val)}
              error={touched.jobHours && !!errors.jobHours}
              helperText={touched.jobHours && errors.jobHours ? errors.jobHours : ""}
            />
          </div>
        )}
      </FormModal>
    </>
  );
}
