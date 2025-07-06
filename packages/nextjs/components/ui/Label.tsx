import * as React from "react";
import { cn } from "@/lib/utils";
import { type VariantProps, cva } from "class-variance-authority";

const labelVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background text-[var(--color-primary-content)]",
  {
    variants: {
      variant: {
        solid: "bg-[var(--color-accent)] text-[var(--color-primary-content)] hover:bg-[var(--color-accent-hover)]",
        outlined:
          "border-2 border-[var(--color-accent)] text-[var(--color-primary-content)] bg-transparent hover:bg-[var(--color-accent-hover)]",
      },
      size: {
        default: "px-3 py-1",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-4 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "solid",
      size: "default",
    },
  },
);

export interface LabelProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof labelVariants> {}

/**
 * @deprecated
 */
const Label = React.forwardRef<HTMLDivElement, LabelProps>(({ className, variant, size, ...props }, ref) => {
  return <div className={cn(labelVariants({ variant, size, className }))} ref={ref} {...props} />;
});

Label.displayName = "Label";

export { Label, labelVariants };
