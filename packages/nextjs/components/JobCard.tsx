"use client";

import * as React from "react";
import { Badge } from "@/components/Badge";
import Button from "@/components/Button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { cn } from "@/lib/utils";
import { StarIcon } from "lucide-react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

type Job = {
  jobId: string;
  freelancer?: `0x${string}`;
  client?: `0x${string}`;
  payment?: string;
  title?: string;
  description?: string;
  category?: string;
  estimatedDuration?: string;
  createdAt?: string;
  acceptedAt?: string;
  deadline?: string;
  completedAt?: string;
  cancelledAt?: string;
  rating?: number;
};

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
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-primary rounded-lg p-6 w-full max-w-sm shadow-lg space-y-4 text-black">
            <h2 className="text-xl font-semibold text-primary-content">Are you sure?</h2>
            <p className="text-sm text-primary-content">
              You’re about to buy <strong>{job.title}</strong> for{" "}
              <strong>{job.payment ? `${formatEther(BigInt(job.payment))} ETH` : "Free"}</strong>.
            </p>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleAccept}
                disabled={isMining}
              >
                {isMining ? "Processing..." : "Yes, Buy"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
