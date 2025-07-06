export interface ButtonProps {
  /**
   * Optional variant for the button, can be "primary", "outline", or "danger".
   * - "primary": Default button style, typically used for main actions.
   * - "outline": Button with a border, used for secondary actions.
   * - "danger": Button styled for destructive actions, like delete.
   * @default "primary"
   */
  variant: "primary" | "outline" | "danger";
  /**
   * Optional children to be rendered inside the button.
   */
  children?: React.ReactNode;
  /**
   * Optional onClick handler for the button.
   */
  onClick?: () => void;
  /**
   * Optional className for custom styling.
   */
  className?: string;
  /**
   * Optional inline styles for the button.
   */
  style?: React.CSSProperties;
  /**
   * Optional disabled state for the button.
   * When true, the button will be unclickable and styled as disabled.
   */
  disabled?: boolean;
  /**
   * Optional loading state for the button.
   * When true, a spinner will be shown inside the button.
   */
  loading?: boolean;
  /**
   * Optional icon to be displayed inside the button.
   * This can be any React node, such as an SVG or an icon component.
   */
  icon?: React.ReactNode;
}
