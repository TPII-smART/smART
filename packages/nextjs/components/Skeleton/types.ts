export interface SkeletonProps {
  variant: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  color?: string; // Optional, for custom color
  animation?: "pulse" | "wave"; // Optional, for animation type\
  children?: React.ReactNode; // Optional, for content inside the skeleton
  className?: string; // Optional, for additional CSS classes
  active?: boolean;
}
