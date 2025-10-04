"use client";

import Image from "next/image";
import { Badge } from "@/components/Badge";
import { Card } from "@/components/Card";
import { isImageUrl } from "@/lib/utils";
import { CheckCircleIcon, ClockIcon, DocumentTextIcon, PhotoIcon } from "@heroicons/react/24/outline";
import AvatarImage from "~~/components/AvatarImage/AvatarImage";
import { useUserProfile } from "~~/hooks/use-user-profile";

interface Deliverable {
  id: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  isIPFS: boolean;
  ipfsHash: string | null;
  sender: {
    name: string;
    avatar: string;
    customAvatar?: React.ReactNode;
    avatarAddress?: string;
    role: string;
  };
  senderComment: string;
  timestamp: string;
  receiver: {
    name: string;
    avatar: string;
    customAvatar?: React.ReactNode;
    avatarAddress?: string;
    role: string;
  } | null;
  receiverResponse: string | null;
  responseTimestamp: string | null;
}

interface DeliverableCardProps {
  deliverable: Deliverable;
}

export function DeliverableCard({ deliverable }: DeliverableCardProps) {
  const { userProfile: freelancerProfilePicture } = useUserProfile(deliverable.sender?.avatarAddress);
  const { userProfile: clientProfilePicture } = useUserProfile(deliverable.receiver?.avatarAddress);

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

  const getAvatarSrc = (role: "client" | "freelancer") => {
    const user = role === "client" ? clientProfilePicture : freelancerProfilePicture;
    return user && isImageUrl(user.profilePicture || "") ? user.profilePicture : "";
  };

  return (
    <Card className="overflow-hidden">
      <div className="grid md:grid-cols-[300px_1fr] gap-6 p-6">
        {/* File Preview */}
        <div className="space-y-3">
          <div className="relative aspect-[3/2] rounded-lg overflow-hidden bg-muted border border-border">
            <Image
              src={deliverable.fileUrl || "/placeholder.svg"}
              alt={deliverable.fileName}
              className="w-full h-full object-cover"
            />
            {deliverable.isIPFS && (
              <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">IPFS</Badge>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              {getFileIcon(deliverable.fileType)}
              <span className="truncate">{deliverable.fileName}</span>
            </div>
            {deliverable.isIPFS && deliverable.ipfsHash && (
              <p className="text-xs text-muted-foreground font-mono truncate">{deliverable.ipfsHash}</p>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div className="space-y-6">
          {/* Sender Comment */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AvatarImage
                src={getAvatarSrc("client")}
                alt={deliverable.sender.name}
                address={deliverable.sender.avatarAddress as `0x${string}`}
                width={40}
                height={40}
                onClickProfileNavigation={true}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-sm">{deliverable.sender.name}</p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">{deliverable.sender.role}</p>
                </div>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <ClockIcon className="h-3 w-3" />
                  {/* {formatDistanceToNow(new Date(deliverable.timestamp), { addSuffix: true })} */}
                </p>
              </div>
            </div>
            <div className="ml-[52px]">
              <p className="text-sm leading-relaxed text-foreground bg-secondary/50 rounded-lg p-4 border border-border">
                {deliverable.senderComment}
              </p>
            </div>
          </div>

          {/* Receiver Response */}
          {deliverable.receiver && deliverable.receiverResponse ? (
            <div className="space-y-3 pl-4 border-l-2 border-primary/30">
              <div className="flex items-start gap-3">
                <AvatarImage
                  src={"freelancer"}
                  alt={deliverable.sender.name}
                  address={deliverable.sender.avatarAddress as `0x${string}`}
                  width={40}
                  height={40}
                  onClickProfileNavigation={true}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm">{deliverable.receiver.name}</p>
                    <span className="text-xs text-muted-foreground">•</span>
                    <p className="text-xs text-muted-foreground">{deliverable.receiver.role}</p>
                    <CheckCircleIcon className="h-4 w-4 text-accent ml-auto" />
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    {/* {formatDistanceToNow(new Date(deliverable.responseTimestamp!), { 
                      addSuffix: true,
                    })}*/}
                  </p>
                </div>
              </div>
              <div className="ml-[52px]">
                <p className="text-sm leading-relaxed text-foreground bg-accent/10 rounded-lg p-4 border border-accent/20">
                  {deliverable.receiverResponse}
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
