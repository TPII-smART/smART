"use client";

import Image from "next/image";
import {
  ArrowTopRightOnSquareIcon,
  DocumentChartBarIcon,
  DocumentIcon,
  DocumentTextIcon,
  LinkIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import { resolveIPFSHash } from "~~/services/IPFS/thirdwebIPFS";

interface DeliverablePreviewProps {
  resource?: string;
  isLink?: boolean;
}

const getLinkPreviewIcon = (url: string) => {
  if (url.match(/\.(jpg|jpeg|png|gif)$/i)) return <PhotoIcon className="h-10 w-10 text-accent " />;
  if (url.match(/\.(pdf)$/i)) return <DocumentTextIcon className="h-10 w-10 text-accent" />;
  if (url.match(/\.(doc|docx)$/i)) return <DocumentIcon className="h-10 w-10 text-accent" />;
  if (url.match(/\.(xls|xlsx|csv)$/i)) return <DocumentChartBarIcon className="h-10 w-10 text-accent" />;
  if (url.match(/figma\.com/i)) return <DocumentIcon className="h-10 w-10 text-accent" />;
  return <LinkIcon className="h-15 w-15 text-accent" />;
};

const DeliverablePreview = ({ resource, isLink }: DeliverablePreviewProps) => {
  const resolvedResource = resource && !isLink ? resolveIPFSHash(resource) : "";

  // Preview para links
  if (isLink && resource) {
    return (
      <div className="relative aspect-[16/9] w-full h-full flex flex-col items-center p-4 gap-4 bg-secondary/50">
        <div className=" flex items-center justify-center">{getLinkPreviewIcon(resource || "")}</div>
        <div className="text-center space-y-2 w-full ">
          <div className="text-xs text-muted-foreground font-medium">External Link</div>
          <div className="text-xs font-mono text-foreground truncate px-2">{resource}</div>
        </div>
        <a
          href={resource}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-3 py-1 rounded text-accent text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition"
        >
          Visit Link
          <ArrowTopRightOnSquareIcon className="h-4 w-4 " />
        </a>
      </div>
    );
  } else if (!isLink && resource) {
    return (
      <div className="relative aspect-[16/9] w-full h-full rounded-lg ">
        <Image
          src={resolvedResource}
          width={400}
          height={300}
          alt="Preview"
          className="w-full h-full object-cover "
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-surface)",
          }}
        />
      </div>
    );
  }
  return <span className="text-muted-foreground opacity-70 text-center block">There is no file delivered.</span>;
};

export default DeliverablePreview;
