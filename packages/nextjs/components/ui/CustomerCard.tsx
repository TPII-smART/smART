import { BlockieAvatar } from "@/components/scaffold-eth";
import { cn } from "@/lib/utils";
import { MessageCircle, UserPlus } from "lucide-react";

type CustomerProps = {
  address: string;
  jobStatus: "ongoing" | "finished" | "cancelled";
  tags?: string[];
  isVerified?: boolean;
  followers?: number;
};

export default function CustomerCard({ address, jobStatus, tags = [] }: CustomerProps) {
  return (
    <div className="group relative overflow-hidden rounded-3xl bg-white p-6 shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.9)] transition-all duration-300 hover:shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.8)]">
      {/* Status indicator */}
      <div className="absolute right-4 top-4">
        <div
          className={cn(
            "h-3 w-3 rounded-full border border-white",
            jobStatus === "ongoing" ? "bg-green-500" : jobStatus === "finished" ? "bg-amber-500" : "bg-red-500",
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
        <h3 className="text-lg font-semibold text-gray-900">{address}</h3>
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

      {/* Action Buttons */}
      <div className="mt-6 flex gap-2">
        <button className="flex-1 rounded-full bg-white py-2 text-sm font-medium text-blue-600 shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.9)] transition-all hover:shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,0.8)]">
          <UserPlus className="mx-auto h-4 w-4" />
        </button>
        <button className="flex-1 rounded-full bg-white py-2 text-sm font-medium text-gray-700 shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.9)] transition-all hover:shadow-[2px_2px_4px_rgba(0,0,0,0.05),-2px_-2px_4px_rgba(255,255,255,0.8)]">
          <MessageCircle className="mx-auto h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
