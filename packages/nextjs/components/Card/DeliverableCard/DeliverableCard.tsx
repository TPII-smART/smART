"use client";

import Image from "next/image";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { CheckCircleIcon, ClockIcon, DocumentTextIcon, PhotoIcon } from "@heroicons/react/24/outline";
import AvatarImage from "~~/components/AvatarImage/AvatarImage";
import DeliverablePreview from "~~/components/DeliverablePreview/DeliverablePreview";
import { resolveIPFSHash } from "~~/services/IPFS/thirdwebIPFS";
import { Deliverable } from "~~/types/deliverable";

// interface DeliverableCard {
//   fileName: string;
//   fileType: string;
//   isLink: boolean;
//   resource: string | null;
//   sender: {
//     name: string;
//     address?: string;
//     avatar?: string;
//     role: string;
//   };
//   senderComment: string;
//   timestamp: string;
//   receiver: {
//     name: string;
//     address?: string;
//     avatar?: string;
//     role: string;
//   } | null;
//   receiverResponse: string | null;
//   responseTimestamp: string | null;
// }

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
}

export function DeliverableCard({ deliverable, client, freelancer }: DeliverableCardProps) {
  // Determine avatar size based on card variant

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
      case "doc":
      case "docx":
        return <DocumentTextIcon className="h-5 w-5" />;
      case "jpg":
      case "png":
      case "gif":
      case "figma":
        return <PhotoIcon className="h-5 w-5" />;
      case "excel":
      case "xlsx":
      case "csv":
        return <PhotoIcon className="h-5 w-5" />;
      default:
        return <DocumentTextIcon className="h-5 w-5" />;
    }
  };

  const resolvedResource = deliverable.resource && !deliverable.isLink ? resolveIPFSHash(deliverable.resource) : "";

  return (
    <Card className="overflow-hidden ">
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
              <a
                href={resolvedResource}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground text-accent font-mono truncate overflow-hidden whitespace-nowrap max-w-xs block"
              >
                {resolvedResource}
              </a>
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
              <div className=" min-w-0">
                <div className="flex flex-col gap-y-1">
                  <div className="flex items-center gap-2 ">
                    <span className="font-bold text-xl">{freelancer.name}</span>
                    <span className="text-xl text-muted-foreground">•</span>
                    <span className="text-base text-muted-foreground text-gray-400">{freelancer.role}</span>
                  </div>
                  <div className="text-sm text-muted-foreground flex items-center gap-1 text-gray-400 ">
                    <ClockIcon className="h-3 w-3" />
                    {deliverable.uploadedAt}
                  </div>
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
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                <ClockIcon className="h-4 w-4" />
                <span>Awaiting response...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
