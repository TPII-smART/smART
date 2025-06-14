// CheckIcon.tsx
import React from "react";

const CheckIcon: React.FC<React.SVGProps<SVGSVGElement>> = () => {
  return (
    <svg width="72" height="65" viewBox="-1 -1 72 65" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="68" height="61" rx="14" fill="var(--color-border)" />
      <rect x="1" y="1" width="68" height="61" rx="14" stroke="var(--color-border)" strokeWidth="4" />
      <line x1="19.1155" y1="39.34" x2="34.5231" y2="49.6933" stroke="white" strokeWidth="4" />
      <line x1="31.7342" y1="50.258" x2="54.1877" y2="15.9529" stroke="white" strokeWidth="4" />
    </svg>
  );
};

export default CheckIcon;
