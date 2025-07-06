export interface CheckboxProps {
  /**
   * Unique identifier for the checkbox component.
   */
  checked: boolean;
  /**
   * Callback function triggered when the checkbox state changes.
   * Receives the new checked state as an argument.
   */
  onChange: (checked: boolean) => void;
  /**
   * Optional label for the checkbox, displayed next to the checkbox icon.
   */
  label?: string;
  /**
   * Optional prop to indicate if the checkbox is disabled.
   */
  className?: string;
  /**
   * Optional inline styles for the checkbox.
   */
  checkStyle?: React.CSSProperties;
  /**
   * Optional inline styles for the checkbox container.
   */
  containerStyle?: React.CSSProperties;
}
