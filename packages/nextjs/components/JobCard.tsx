"use client";

import * as React from "react";
import Modal from "./Modal/Modal";
import { Badge } from "@/components/Badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { cn } from "@/lib/utils";
import { StarIcon } from "lucide-react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { Job } from "~~/types/job.types";

interface JobCardProps extends React.HTMLAttributes<HTMLDivElement> {
  job: Job;
}

export function JobCard({ job, className, ...props }: JobCardProps) {
  const { address } = useAccount();
  const [showModal, setShowModal] = React.useState(false);
  const { writeContractAsync, isMining } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  const handleAccept = async () => {
    try {
      if (!job.payment || !job.jobId) return;
      await writeContractAsync({
        functionName: "acceptJob",
        args: [BigInt(job.jobId)],
        value: BigInt(job.payment),
      });
      setShowModal(false);
    } catch (err) {
      console.error("Accept job failed:", err);
    }
  };

  const isMyOwnJob = job.freelancer?.toLowerCase() === address?.toLowerCase();

  return (
    <>
      <Card className={cn("group relative overflow-hidden transition-all hover:shadow-lg", className)} {...props}>
        <CardHeader>
          <CardTitle>{job.title}</CardTitle>
          <CardDescription className="mt-2">{job.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <div className="w-fit">
            <Badge variant="secondary">{job.category}</Badge>
          </div>
          <div className="flex items-center gap-1 text-yellow-500">
            <StarIcon className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">{job.rating ? job.rating : 0}</span>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-lg font-bold">{job.payment ? `${formatEther(BigInt(job.payment))} ETH` : "Free"}</span>
          {!isMyOwnJob && (
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Buy Now
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Confirm Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Confirm Purchase"
        variant="form"
        onSubmit={handleAccept}
        loading={isMining}
        cancelLabel="Cancel"
        submitLabel="Yes, Buy"
        description={
          <label>
            {"You're about to buy"} <strong>{job.title}</strong> {"for "}
            <strong>{job.payment ? `${formatEther(BigInt(job.payment))} ETH` : "Free"}</strong>
          </label>
        }
      />
    </>
  );
}
