import React from "react";

interface SeparatorProps {
  className?: string;
}

const Separator: React.FC<SeparatorProps> = ({ className = "" }) => (
  <hr
    className={`my-4 border-t border-[var(--color-inside-border)] opacity-60 ${className}`}
    aria-orientation="horizontal"
  />
);

export default Separator;
