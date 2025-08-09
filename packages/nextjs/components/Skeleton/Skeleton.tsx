import { SkeletonProps } from "./types";
import MUISkeleton from "@mui/material/Skeleton";

export default function Skeleton({
  variant,
  height,
  width,
  animation = "wave",
  color = "var(--color-skeleton)",
  children,
  className,
  active = true,
}: SkeletonProps) {
  return active ? (
    <MUISkeleton
      sx={{
        bgcolor: color,
        "&.MuiSkeleton-root::after": {
          background: () => `linear-gradient(90deg, transparent 0%, rgb(140,140,140) 50%, transparent 100%)`,
        },
        animationDuration: "3s",
      }}
      variant={variant}
      width={width}
      height={height}
      animation={animation}
      className={className}
    >
      {children}
    </MUISkeleton>
  ) : (
    children
  );
}
