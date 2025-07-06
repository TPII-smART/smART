import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "default" | "secondary";
}

export function Badge({ children, variant = "default", className, ...props }: BadgeProps) {
  const base = "inline-block rounded-full px-3 py-1 text-xs font-semibold";
  const variants = {
    default: "bg-[var(--color-accent)] text-[var(--color-primary-content)]",
    secondary: "bg-[var(--color-secondary)] text-[var(--color-secondary-content)]",
  };
  return (
    <span className={`${base} ${variants[variant]} ${className ?? ""}`} {...props}>
      {children}
    </span>
  );
}
