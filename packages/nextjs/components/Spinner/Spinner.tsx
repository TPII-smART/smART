import React from "react";
import { SpinnerArcProps, SpinnerProps } from "./types";
import { Box } from "@mui/material";
import { keyframes, styled } from "@mui/system";

// Keyframes for the individual arc animation (grow and shrink)
const arcAnimation = (color: string) => keyframes`
  0% {
    transform: rotate(0deg);
    border-top-color: transparent;
    border-right-color: transparent;
    border-bottom-color: transparent;
    border-left-color: transparent;
    opacity: 0;
  }
  20% {
    transform: rotate(72deg);
    border-top-color: ${color};
    border-right-color: transparent;
    border-bottom-color: transparent;
    border-left-color: transparent;
    opacity: 1;
  }
  40% {
    transform: rotate(144deg);
    border-top-color: ${color};
    border-right-color: ${color};
    border-bottom-color: transparent;
    border-left-color: transparent;
    opacity: 1;
  }
  60% {
    transform: rotate(216deg);
    border-top-color: transparent;
    border-right-color: ${color};
    border-bottom-color: ${color};
    border-left-color: transparent;
    opacity: 1;
  }
  80% {
    transform: rotate(288deg);
    border-top-color: transparent;
    border-right-color: transparent;
    border-bottom-color: ${color};
    border-left-color: ${color};
    opacity: 1;
  }
  100% {
    transform: rotate(360deg);
    border-top-color: transparent;
    border-right-color: transparent;
    border-bottom-color: transparent;
    border-left-color: ${color};
    opacity: 0;
  }
`;

// Styled component for each arc segment
const SpinnerArc = styled("div")<SpinnerArcProps>(({ size, thickness, speed, delay, color }) => ({
  position: "absolute",
  width: size,
  height: size,
  borderRadius: "50%",
  border: `${thickness}px solid transparent`,
  borderColor: "transparent",
  animation: `${arcAnimation(color)} ${speed}ms infinite ease-in-out`,
  animationDelay: `${delay}ms`,
  boxSizing: "border-box",
  top: "50%",
  left: "50%",
  transformOrigin: "center center",
  translate: "-50% -50%", // Center arcs,
}));

export const Spinner: React.FC<SpinnerProps> = ({
  size = 80,
  color,
  thickness = 4,
  speed = 2250,
  delay = 2000,
  sizeMultiplier = 0.3,
  numberOfArcs = 4,
  sx,
  boxSx,
  ariaLabel = "Loading...",
  variant = "default",
}) => {
  const _color = color || getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim();

  const BaseSpinner = () => {
    if (numberOfArcs < 1) {
      console.warn("Spinner: numberOfArcs must be at least 1. Defaulting to 4.");
      numberOfArcs = 4; // Ensure at least one arc is rendered
    }

    // Calculate delays for each arc to create the staggered effect
    const delays = Array.from({ length: numberOfArcs }, (_, i) => (i * delay) / numberOfArcs);

    return (
      <Box
        aria-label={ariaLabel}
        sx={{
          display: "flex",
          backgroundColor: "transparent",
          justifyContent: "center",
          alignItems: "center",
          ...boxSx,
          overflow: "hidden", // Prevent spinner from causing scrollbars
          position: "relative",
          minHeight: size * (delays.length + 1) * sizeMultiplier,
          minWidth: size * (delays.length + 1) * sizeMultiplier,
        }}
      >
        {delays.map((_delay, index) => (
          <SpinnerArc
            key={index}
            size={size * (delays.length - index) * sizeMultiplier}
            thickness={thickness}
            delay={_delay}
            speed={speed}
            color={_color}
            sx={{
              transform: `rotate(${index * (360 / numberOfArcs)}deg)`,
              ...sx,
            }}
          />
        ))}
      </Box>
    );
  };

  switch (variant) {
    case "global":
      return (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: theme => theme.zIndex.modal + 1,
            borderRadius: "inherit",
            overflow: "hidden", // Prevent overlay from causing scrollbars
          }}
        >
          <BaseSpinner />
        </Box>
      );
    default:
      return <BaseSpinner />;
  }
};

export default Spinner;
