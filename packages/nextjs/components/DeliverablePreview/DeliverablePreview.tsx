"use client";

import Image from "next/image";

interface DeliverablePreviewProps {
  resource?: string;
  isLink?: boolean;
}

const DeliverablePreview = ({ resource, isLink }: DeliverablePreviewProps) => {
  if (isLink && resource) {
    return (
      <div>
        <a
          href={resource}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--color-accent)" }}
          className="underline break-all"
        >
          {resource}
        </a>
      </div>
    );
  } else if (!isLink && resource) {
    return (
      <div className="flex flex-col items-center gap-2">
        <Image
          src={resource}
          width={150}
          height={150}
          alt="Preview"
          className="max-h-64 rounded border"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-surface)",
          }}
        />
        <a
          href={resource}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
          style={{ color: "var(--color-accent)" }}
        >
          View complete image
        </a>
      </div>
    );
  }
  return <span style={{ color: "var(--color-secondary-content)", opacity: 0.7 }}>There is no file delivered.</span>;
};

export default DeliverablePreview;
