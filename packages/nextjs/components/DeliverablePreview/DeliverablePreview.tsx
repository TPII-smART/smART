"use client";

import Image from "next/image";
import { ArrowTopRightOnSquareIcon } from "@heroicons/react/24/outline";
import { resolveIPFSHash } from "~~/services/IPFS/pinataIPFS";

interface DeliverablePreviewProps {
  resource?: string;
}

const DeliverablePreview = ({ resource }: DeliverablePreviewProps) => {
  const resolvedResource = resource ? resolveIPFSHash(resource) : "";

  // Preview para links
  if (resource) {
    return (
      <div className="relative aspect-[16/9] w-full h-full rounded-lg group">
        <a href={resolvedResource} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
          <Image
            src={resolvedResource}
            width={400}
            height={300}
            alt="Preview"
            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-surface)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ArrowTopRightOnSquareIcon className="h-10 w-10 text-white" />
          </div>
        </a>
      </div>
    );
  }
  return <span className="text-muted-foreground opacity-70 text-center block">There is no file delivered.</span>;
};

export default DeliverablePreview;
