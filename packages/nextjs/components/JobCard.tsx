"use client";

import * as React from "react";
import Image from "next/image";
import Modal from "./Modal/Modal";
import { Badge } from "@/components/Badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { InputBase } from "@/components/scaffold-eth";
import { cn } from "@/lib/utils";
import { StarIcon } from "lucide-react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { JobPosting } from "~~/types/job.types";

interface JobCardProps extends React.HTMLAttributes<HTMLDivElement> {
  jobPosting?: JobPosting;
}

export function JobCard({ jobPosting, className, ...props }: JobCardProps) {
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
          BigInt(jobPosting?.basePayment),
          form.title,
          form.description,
          BigInt(form.jobHours),
        ],
        value: BigInt(jobPosting?.basePayment),
      });
      setShowModal(false);
    } catch (err) {
      console.error("Create job failed:", err);
    }
  };

  const isMyOwnJob = jobPosting?.freelancer?.toLowerCase() === address?.toLowerCase();

  return (
    <>
      <Card className={cn("group relative overflow-hidden transition-all hover:shadow-lg", className)} {...props}>
        {/* Banner Image */}
        {jobPosting?.bannerImageUrl && (
          <Image src={jobPosting.bannerImageUrl} alt="Job Banner" className="h-40 w-full object-cover" />
        )}
        <CardHeader>
          <CardTitle>{jobPosting?.title}</CardTitle>
          <CardDescription className="mt-2">{jobPosting?.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="w-fit">
            <Badge variant="secondary">{jobPosting?.category}</Badge>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <StarIcon className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">{jobPosting?.rating ? jobPosting.rating : 0}</span>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-lg font-bold">
            {jobPosting?.basePayment ? `${formatEther(BigInt(jobPosting.basePayment))} ETH` : "Free"}
          </span>
          {!isMyOwnJob && (
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Hire
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Confirm Modal */}
      <Modal
        title="Create a job"
        variant="form"
        onClose={() => setShowModal(false)}
        onSubmit={handleCreateJob}
        isOpen={showModal}
        loading={isMining}
        description="You are about to create a job based on this posting."
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
