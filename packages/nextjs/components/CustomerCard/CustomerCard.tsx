import { CustomerProps } from "./types";
import { BlockieAvatar } from "@/components/scaffold-eth";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle } from "lucide-react";
import { formatEther } from "viem";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

export default function CustomerCard({ address, job }: CustomerProps) {
  const tags = job.category ? [job.category] : [];
  const jobStatus = job.completedAt
    ? "Finished"
    : job.cancelledAt
      ? "Cancelled"
      : job.acceptedAt
        ? "Ongoing"
        : "Available";

  const { writeContractAsync: writeContract } = useScaffoldWriteContract({
    contractName: "JobsContract",
  });

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

  const handleCancel = async () => {
    try {
      if (!job.payment || !job.jobId) return;
      await writeContract({
        functionName: "cancelJob",
        args: [BigInt(job.jobId)],
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
        args: [BigInt(job.jobId)],
      });
    } catch (err) {
      console.error("Confirm job completion failed:", err);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.9)] transition-all duration-300 hover:shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)]">
      {/* Status indicator */}
      <div className="absolute right-4 top-4">
        <div
          className={cn(
            "h-3 w-3 rounded-full border border-white",
            jobStatus === "Ongoing"
              ? "bg-green-500"
              : jobStatus === "Finished"
                ? "bg-amber-500"
                : jobStatus === "Cancelled"
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

      {/* Status and Dates */}
      <div className="mt-4 text-center">
        <h4 className="text-sm font-medium text-gray-900">Status: {jobStatus}</h4>

        <p className="text-sm text-gray-900">
          {job.createdAt ? `Created At: ${toDate(job.createdAt)}` : "Creation date not specified"}
        </p>

        {job.acceptedAt && job.completedAt ? (
          <p className="text-sm text-gray-900">Completed At: {toDate(job.completedAt)}</p>
        ) : job.cancelledAt ? (
          <p className="text-sm text-gray-900">Cancelled At: {toDate(job.cancelledAt)}</p>
        ) : (
          <>
            <p className="text-sm text-gray-900">
              Accepted At: {job.acceptedAt ? toDate(job.acceptedAt) : "Not accepted yet"}
            </p>
            <p className="text-sm text-gray-900">Deadline: {job.deadline ? toDate(job.deadline) : "No deadline set"}</p>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex gap-2">
        {/* Cancel Button */}
        <button
          className={cn(
            "flex-1 rounded-full bg-white py-2 text-sm font-medium shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.9)] transition-all",
            "hover:shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,0.8)]",
            jobStatus === "Finished" || jobStatus === "Cancelled"
              ? "text-gray-400 cursor-not-allowed opacity-50"
              : "text-red-600",
          )}
          disabled={jobStatus === "Finished" || jobStatus === "Cancelled"}
          onClick={handleCancel}
        >
          <XCircle className="mx-auto h-4 w-4" />
        </button>

        {/* Confirm Completion Button */}
        <button
          className={cn(
            "flex-1 rounded-full bg-white py-2 text-sm font-medium shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.9)] transition-all",
            "hover:shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,0.8)]",
            jobStatus === "Finished" || jobStatus === "Cancelled" || jobStatus === "Available"
              ? "text-gray-400 cursor-not-allowed opacity-50"
              : "text-green-700",
          )}
          disabled={jobStatus === "Finished" || jobStatus === "Cancelled" || jobStatus === "Available"}
          onClick={handleConfirmCompletion}
        >
          <CheckCircle className="mx-auto h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
