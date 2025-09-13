export interface SVGIconProps {
  /**
   * The label for the SVG icon, used for accessibility.
   */
  label?: string;
  /**
   * The width of the SVG icon.
   */
  width?: number;
  /**
   * The height of the SVG icon.
   */
  height?: number;
  /**
   * OnClick handler for the SVG icon.
   */
  onClick?: () => void;
  /**
   * href for the SVG icon, if it should be a link.
   * If provided, the icon will be wrapped in an anchor tag.
   * If not provided, it will be a simple SVG element.
   */
  href?: string;
  /**
   * Color override for the SVG icon.
   */
  color?: string;
}
