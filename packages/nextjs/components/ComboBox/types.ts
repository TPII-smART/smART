import { SxProps } from "@mui/material/styles";
import { Theme } from "@mui/system";

export type ComboValue = any;

export interface ComboBoxProps {
  /*
   * Unique identifier for the ComboBox component.
   */
  id: string;
  /*
   * Label for the ComboBox, displayed above the input field.
   */
  label: string;
  /*
   * Callback function triggered when the selected value changes.
   * Receives the new value as an argument.
   */
  onChange: (val: ComboValue) => void;
  /*
   * Current value of the ComboBox.
   * Can be a single value or an array for multiple selection.
   */
  value: ComboValue;
  /*
   * Array of options for the ComboBox.
   * Each option should have an `id` and an optional `label`.
   */
  options: Array<{ id: ComboValue; label?: string }>;
  /*
   * Optional prop to indicate if the ComboBox has an error state.
   */
  error?: boolean;
  /*
   * Optional prop to disable the ComboBox.
   */
  disabled?: boolean;
  /*
   * Optional prop to specify the variant of the ComboBox.
   * Can be "standard", "filled", or "outlined".
   */
  variant?: "standard" | "filled" | "outlined";
  /*
   * Optional inline styles for the ComboBox.
   */
  style?: React.CSSProperties;
  /*
   * Optional MUI sx prop for styling the ComboBox.
   * Allows for more complex styling using the MUI system.
   */
  sx?: SxProps<Theme>;
  /*
   * Optional prop to indicate if the ComboBox allows multiple selections.
   * If true, the value should be an array of selected values.
   */
  multiple?: boolean;
  /*
   * Optional prop to reset the ComboBox value in multiple selection.
   * If provided, the ComboBox will reset to only this value when triggered.
   */
  resetKey?: string;
  /*
   * Optional icon to display in the ComboBox.
   * Can be a React node, such as an SVG or icon component.
   */
  icon?: React.ReactNode;
}
