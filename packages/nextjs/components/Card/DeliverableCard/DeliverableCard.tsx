"use client";

import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { DeliverableState } from "@se-2/common";
import { CheckCircleIcon, ClockIcon } from "@heroicons/react/24/outline";
import AvatarImage from "~~/components/AvatarImage/AvatarImage";
import DeliverablePreview from "~~/components/DeliverablePreview/DeliverablePreview";
import { resolveIPFSHash } from "~~/services/IPFS/thirdwebIPFS";
import { Deliverable } from "~~/types/deliverable";

interface participantDeliverable {
  name: string;
  address?: string;
  avatarSrc?: string;
  role: string;
}

interface DeliverableCardProps {
  key: string;
  deliverable: Deliverable;
  freelancer: participantDeliverable;
  client: participantDeliverable | null;
  actionButtons: React.ReactNode[];
  isPreviewModalOpen: boolean;
  onCloseReviewModal: () => void;
}

const getStatusBadge = (status: number) => {
  const badgeClass = "min-w-[110px] text-center ";
  switch (status) {
    case DeliverableState.Pending:
      return (
        <Badge
          className={`bg-amber-200 text-amber-800 border border-amber-300 shadow-sm ${badgeClass} hover:bg-amber-300 transition-colors`}
        >
          Pending Review
        </Badge>
      );
    case DeliverableState.Approved:
      return (
        <Badge className={`bg-[var(--color-success)] text-[var(--color-primary-content)] ${badgeClass}`}>
          Approved
        </Badge>
      );
    case DeliverableState.Rejected:
      return <Badge className={`bg-[var(--color-error)] text-white ${badgeClass}`}>Rejected</Badge>;

    case DeliverableState.Disputed:
      return <Badge className={`bg-[var(--color-accent)] text-white ${badgeClass}`}>Disputed</Badge>;
    default:
      return null;
  }
};

export function DeliverableCard({
  deliverable,
  client,
  freelancer,
  actionButtons,
  isPreviewModalOpen,
  onCloseReviewModal,
}: DeliverableCardProps) {
  const resolvedResource = deliverable.resource && !deliverable.isLink ? resolveIPFSHash(deliverable.resource) : "";

  return (
    <Card className="overflow-hidden relative ">
      <div className="absolute top-4 right-4 z-10">{getStatusBadge(deliverable.state)}</div>
      <div className="grid md:grid-cols-[300px_1fr] gap-10 py-20 px-10 w-full">
        {/* File Preview */}
        <div className="space-y-3 w-full max-h-[200px] ">
          <div className="relative aspect-[16/9] w-full h-full rounded-lg overflow-hidden bg-muted border border-border">
            <DeliverablePreview resource={deliverable.resource} isLink={deliverable.isLink} />
            {!deliverable.isLink && (
              <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">IPFS</Badge>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium"></div>
            {!deliverable.isLink && deliverable.resource && (
              <div className="text-xs text-muted-foreground text-accent font-mono truncate overflow-hidden whitespace-nowrap max-w-xs block">
                {resolvedResource}
              </div>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          {/* Sender Comment */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className={`relative rounded-full overflow-hidden`}>
                <AvatarImage
                  src={freelancer.avatarSrc}
                  alt={"Deliverable"}
                  width={60}
                  height={60}
                  address={freelancer.address as `0x${string}`}
                  onClickProfileNavigation={true}
                />
              </div>
              <div className="flex flex-col gap-y-1 justify-between w-full">
                <div className="flex gap-2 w-full items-center">
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-xl">{freelancer.name}</span>
                    <span className="text-xl text-muted-foreground">•</span>
                    <span className="text-base text-muted-foreground text-gray-400">{freelancer.role}</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground flex items-center gap-1 text-gray-400 ">
                  <ClockIcon className="h-3 w-3" />
                  {deliverable.uploadedAt}
                </div>
              </div>
            </div>
            <div className="ml-[52px]">
              <p className="text-sm leading-relaxed text-foreground bg-secondary/50 rounded-lg p-4 border border-border">
                {deliverable.submissionComment}
              </p>
            </div>
          </div>

          {/* Receiver Response */}
          {client && deliverable.clientResponse ? (
            <div className="space-y-3 pl-4 border-l-2 border-accent/20 ">
              <div className="flex items-start gap-3">
                <div className={`relative rounded-full overflow-hidden`}>
                  <AvatarImage
                    src={client.avatarSrc}
                    alt={"Deliverable"}
                    address={client.address as `0x${string}`}
                    width={60}
                    height={60}
                    onClickProfileNavigation={true}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold  text-xl">{client.name}</span>
                    <span className="text-xl text-muted-foreground">•</span>
                    <span className="text-base text-muted-foreground text-gray-400">{client.role}</span>
                    <CheckCircleIcon className="h-4 w-4 text-accent ml-auto" />
                  </div>

                  <div className="text-sm text-muted-foreground flex items-center gap-1 text-gray-400 ">
                    <ClockIcon className="h-3 w-3" />
                    {deliverable.responseTimestamp}
                  </div>
                </div>
              </div>
              <div className="ml-[52px] ">
                <p className="text-sm leading-relaxed text-foreground bg-accent/10 rounded-lg p-4 border border-accent/20 break-words whitespace-pre-line ">
                  {deliverable.clientResponse}
                </p>
              </div>
            </div>
          ) : (
            <div className="pl-4 border-l-2 border-dashed border-border">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                  <ClockIcon className="h-4 w-4" />
                  <span>Awaiting response...</span>
                </div>
                {actionButtons && actionButtons.length > 0 && <div className="flex justify-end ">{actionButtons}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
