// CheckIcon.tsx
import React from "react";

const UncheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = () => {
  return (
    <svg width="72" height="65" viewBox="-1 -1 72 65" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="68" height="61" rx="14" fill="var(--color-primary)" />
      <rect x="1" y="1" width="68" height="61" rx="14" stroke="var(--color-border)" strokeWidth="4" />
    </svg>
  );
};

export default UncheckIcon;
