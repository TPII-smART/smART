import { CustomerProps } from "./types";
import { BlockieAvatar } from "@/components/scaffold-eth";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";
import { JobState } from "~~/types/job.types";

export default function CustomerCard({ address, job }: CustomerProps) {
  const { address: userAddress } = useAccount();
  const tags = job.category ? [job.category] : [];
  const jobStatus = job.state as JobState;

  const { writeContractAsync: writeContract } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

  console.log("User Address:", userAddress);
  console.log("Job Status:", jobStatus);
  console.log("Job freelancer:", job.freelancer);

  const awaitingFreelancer =
    job.freelancer?.toLowerCase() !== userAddress?.toLowerCase() && jobStatus === JobState.WaitingForApproval;
  console.log("Awaiting Freelancer:", awaitingFreelancer);

  /*
  const toDate = (timestamp: string | number): string => {
    const ts = Number(timestamp);
    const date = new Date(ts * 1000); // convert from seconds to milliseconds

    return isNaN(date.getTime())
      ? "Invalid date"
      : date.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
  };
  */

  const handleAccept = async () => {
    try {
      console.log("Accepting job:", job);
      if (job.state !== JobState.WaitingForApproval) return;
      console.log("Writing contract to accept job:", job.postingId, job.jobId);
      await writeContract({
        functionName: "acceptJob",
        args: [BigInt(job.postingId), BigInt(job.jobId)],
      });
    } catch (err) {
      console.error("Accept job failed:", err);
    }
  };

  const handleCancel = async () => {
    try {
      if (!job.payment || !job.jobId) return;
      await writeContract({
        functionName: "cancelJob",
        args: [BigInt(job.postingId), BigInt(job.jobId)],
      });
    } catch (err) {
      console.error("Cancel job failed:", err);
    }
  };

  const handleConfirmCompletion = async () => {
    try {
      if (!job.jobId) return;
      await writeContract({
        functionName: "confirmCompletion",
        args: [BigInt(job.postingId), BigInt(job.jobId)],
      });
    } catch (err) {
      console.error("Confirm job completion failed:", err);
    }
  };

  const handleAction = async () => {
    if (jobStatus === JobState.WaitingForApproval) {
      await handleAccept();
    } else {
      await handleConfirmCompletion();
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.9)] transition-all duration-300 hover:shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)]">
      {/* Status indicator */}
      <div className="absolute right-4 top-4">
        <div
          className={cn(
            "h-3 w-3 rounded-full border border-white",
            jobStatus === JobState.WaitingForApproval
              ? "bg-gray-300"
              : jobStatus === JobState.Ongoing
                ? "bg-green-500"
                : jobStatus === JobState.Finished
                  ? "bg-amber-500"
                  : jobStatus === JobState.Cancelled
                    ? "bg-red-500"
                    : "bg-blue-300",
          )}
        ></div>
      </div>

      {/* Profile Photo */}
      <div className="mb-4 flex justify-center">
        <div className="relative">
          <div className="h-28 w-28 overflow-hidden rounded-full bg-white p-1 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.1),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]">
            <BlockieAvatar address={address} size={120} />
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">{job.title || "Untitled Job"}</h3>
        <p className="text-sm text-gray-600 mt-1">
          {job.freelancer ? `Freelancer: ${job.freelancer}` : "No freelancer assigned"}
        </p>
        <p className="text-sm text-gray-600 mt-1">{job.client ? `Client: ${job.client}` : "No client assigned"}</p>
        <p className="text-sm text-gray-600 mt-1">
          {job.payment ? `Payment: ${formatEther(BigInt(job.payment))} ETH` : "Payment not specified"}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {job.description ? `Description: ${job.description}` : "No description provided"}
        </p>
      </div>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="mt-4 flex justify-center gap-2">
          {tags.map((tag, i) => (
            <span
              key={i}
              className={cn(
                "inline-block rounded-full bg-white px-3 py-1 text-xs font-medium shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,0.8)]",
                tag === "Premium" ? "text-blue-600" : "text-gray-600",
              )}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Status */}
      <div className="mt-2 flex justify-center">
        <span
          className={cn(
            "inline-block rounded-full px-3 py-1 text-xs font-medium",
            jobStatus === JobState.WaitingForApproval
              ? "bg-gray-300 text-gray-800"
              : jobStatus === JobState.Ongoing
                ? "bg-green-500 text-white"
                : jobStatus === JobState.Finished
                  ? "bg-amber-500 text-white"
                  : jobStatus === JobState.Cancelled
                    ? "bg-red-500 text-white"
                    : "bg-blue-300 text-white",
          )}
        >
          {(() => {
            switch (jobStatus) {
              case JobState.WaitingForApproval:
                return "Waiting for Approval";
              case JobState.Ongoing:
                return "Ongoing";
              case JobState.Finished:
                return "Finished";
              case JobState.Cancelled:
                return "Cancelled";
              default:
                return "Unknown";
            }
          })()}
        </span>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-2">
        {/* Cancel Button */}
        <button
          className={cn(
            "flex-1 rounded-full bg-white py-2 text-sm font-medium shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.9)] transition-all",
            "hover:shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,0.8)]",
            jobStatus === JobState.Finished || jobStatus === JobState.Cancelled
              ? "text-gray-400 cursor-not-allowed opacity-50"
              : "text-red-600",
          )}
          disabled={jobStatus === JobState.Finished || jobStatus === JobState.Cancelled}
          onClick={handleCancel}
        >
          <XCircle className="mx-auto h-4 w-4" />
        </button>

        {/* Confirm Completion Button */}
        <button
          className={cn(
            "flex-1 rounded-full bg-white py-2 text-sm font-medium shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.9)] transition-all",
            "hover:shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,0.8)]",
            jobStatus === JobState.Finished || jobStatus === JobState.Cancelled || awaitingFreelancer
              ? "text-gray-400 cursor-not-allowed opacity-50"
              : "text-green-700",
          )}
          disabled={jobStatus === JobState.Finished || jobStatus === JobState.Cancelled || awaitingFreelancer}
          onClick={handleAction}
        >
          <CheckCircle className="mx-auto h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
