import { SxProps } from "@mui/material/styles";
import { Theme } from "@mui/system";

export type ComboValue = string;

export interface ComboBoxProps {
  id: string;
  label: string;
  onChange: (val: ComboValue) => void;
  value: ComboValue;
  options: Array<{ id: ComboValue; label?: string }>;
  error?: boolean;
  disabled?: boolean;
  variant?: "standard" | "filled" | "outlined";
  style?: React.CSSProperties;
  sx?: SxProps<Theme>;
  multiple?: boolean; // Optional prop for multiple selection
}
