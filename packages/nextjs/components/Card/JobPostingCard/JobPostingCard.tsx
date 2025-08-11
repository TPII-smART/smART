"use client";

import * as React from "react";
import Modal from "../../Modal/Modal";
import { JobPostingCardProps } from "./types";
import { UniversalCard } from "@/components/Card/UniversalCard";
import { InputBase } from "@/components/scaffold-eth";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export function JobPostingCard({ jobPosting, className, reload, ...props }: JobPostingCardProps) {
  const { address } = useAccount();
  const [showModal, setShowModal] = React.useState(false);
  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    jobHours: "48",
  });

  const handleCreateJob = async () => {
    try {
      if (!jobPosting?.basePayment || !jobPosting?.postingId) return;
      await writeContractAsync({
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
      if (reload) await reload();
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

  return (
    <>
      <UniversalCard
        bannerUrl={jobPosting?.bannerImageHash}
        avatarAddress={jobPosting?.freelancer}
        title={jobPosting?.title}
        description={jobPosting?.description}
        extraInfo={`Average work duration: ${jobPosting?.averageWorkDuration} hours`}
        category={jobPosting?.category}
        rating={jobPosting?.rating ? jobPosting.rating : 0}
        paymentDisplay={paymentDisplay}
        footerLeft={<div className="flex items-center gap-4">{paymentDisplay}</div>}
        footerRight={hireButton}
        className={className}
        {...props}
      />

      {/* Confirm Modal */}
      <Modal
        title="Hire this Freelancer"
        variant="form"
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateJob}
        isOpen={showModal}
        loading={isMining}
        description={`You are about to create a job based on this posting. The price will be deducted from your wallet: ${jobPosting?.basePayment ? `${formatEther(BigInt(jobPosting.basePayment))} ETH` : "Free"}`}
      >
        <div className="space-y-4">
          <InputBase placeholder="Title" value={form.title} onChange={val => setForm({ ...form, title: val })} />
          <InputBase
            placeholder="Description"
            value={form.description}
            onChange={val => setForm({ ...form, description: val })}
          />
          <InputBase
            placeholder="Job Duration (hours)"
            value={form.jobHours}
            onChange={val => setForm({ ...form, jobHours: val })}
          />
        </div>
      </Modal>
    </>
  );
}
