export interface SpinnerProps {
  /**
   * The size of the spinner in pixels.
   */
  size?: number;
  /**
   * Multiplier for the size of the spinner arcs.
   */
  sizeMultiplier?: number;
  /**
   * The number of arcs in the spinner.
   */
  numberOfArcs?: number;
  /**
   * The color of the spinner.
   */
  color?: string;
  /**
   * The thickness of the spinner's stroke.
   */
  thickness?: number;
  /**
   * The speed of the spinner's rotation in milliseconds.
   */
  speed?: number;
  /**
   * The delay for the spinner's animation in milliseconds.
   */
  delay?: number;
  /**
   * Inline styles for custom styling.
   */
  sx?: React.CSSProperties;
  /**
   * Styles for the box containing the spinner.
   */
  boxSx?: React.CSSProperties;
  /**
   * The accessibility label for screen readers.
   */
  ariaLabel?: string;
  /**
   * The variant of the spinner, e.g., default or global.
   */
  variant?: "default" | "global";
  /**
   * The children elements to be rendered inside the spinner.
   */
  children?: React.ReactNode;
}

// Types for custom props
export interface SpinnerArcProps {
  /**
   * The size of the arc segment.
   */
  size: number;
  /**
   * The thickness of the arc segment.
   */
  thickness: number;
  /**
   * The speed of the arc segment's animation.
   */
  speed: number;
  /**
   * The delay for the arc segment's animation.
   */
  delay: number;
  /**
   * The color of the arc segment.
   */
  color: string;
}
