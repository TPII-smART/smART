import * as React from "react";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { SxProps } from "@mui/material/styles";
import { Box, Theme } from "@mui/system";

export type ComboValue = string;

export interface ComboBoxProps {
  id: string;
  label: string;
  onChange: (val: ComboValue) => void;
  value: ComboValue;
  options: Array<{ value: ComboValue; label?: string }>;
  error?: boolean;
  disabled?: boolean;
  variant?: "standard" | "filled" | "outlined";
  style?: React.CSSProperties;
  sx?: SxProps<Theme>;
  multiple?: boolean; // Optional prop for multiple selection
}

const _style: React.CSSProperties = {
  width: "100%",
  minWidth: "120px",
  margin: "1px",
};

const _sx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--color-accent) !important",
  },
  ".MuiSelect-select": {
    color: "var(--color-primary-content) !important",
  },
  "& .MuiFormLabel-root": {
    color: "var(--color-secondary-content) !important",
  },
  "& .MuiFormLabel-root-focused": {
    color: "var(--color-primary-content) !important",
  },
  "& .MuiSelect-icon": {
    color: "var(--color-accent)",
  },
  ".MuiSelect-filled": {
    backgroundColor: "var(--color-surface)",
    borderRadius: "4px",
  },
  ".MuiFilledInput-underline": {
    // Default (unfocused) line color
    "&:before": {
      borderColor: "var(--color-secondary-content)", // Your desired unfocused line color
    },
    // Focused line color
    "&:after": {
      borderColor: "var(--color-accent)", // Your desired focused line color
    },
    // Hover line color
    "&:hover:not(.Mui-disabled):before": {
      borderColor: "var(--color-primary-content)", // Your desired hover line color
    },
  },
  ".MuiInput-underline": {
    // Default (unfocused) line color
    "&:before": {
      borderColor: "var(--color-secondary-content)", // Your desired unfocused line color
    },
    // Focused line color
    "&:after": {
      borderColor: "var(--color-accent)", // Your desired focused line color
    },
    // Hover line color
    "&:hover:not(.Mui-disabled):before": {
      borderColor: "var(--color-primary-content)", // Your desired hover line color
    },
  },
  "& .Mui-focused .MuiSelect-icon": {
    color: "var(--color-accent)",
  },
};

const menuProps = {
  PaperProps: {
    sx: {
      backgroundColor: "var(--color-surface)",
      color: "var(--color-primary-content)",
      borderRadius: "10px",
    },
  },
};

export default function ComboBox({
  id,
  variant,
  label,
  onChange,
  value,
  options,
  error,
  disabled,
  style,
  sx,
  multiple = false, // Default to single selection
}: ComboBoxProps) {
  const handleChange = (event: SelectChangeEvent) => {
    if (multiple) {
      const {
        target: { value },
      } = event;
      onChange(typeof value === "string" ? value.split(",") : value);
    } else {
      onChange(event.target.value);
    }
  };

  const __style = { ..._style, ...style };
  const __sx = { ..._sx, ...sx };

  return (
    <div>
      <FormControl variant={variant} style={__style} sx={__sx} error={error} disabled={disabled}>
        <InputLabel id={id + "_label"}>{label}</InputLabel>
        {multiple ? (
          // Multiple selection
          <Select
            labelId={id + "_label"}
            id={id}
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={handleChange}
            label={label}
            multiple
            MenuProps={menuProps}
            renderValue={selected => (
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                {selected.map(value => (
                  <Chip
                    key={value}
                    label={value}
                    sx={{
                      ".MuiChip-label": {
                        color: "var(--color-primary-content)",
                      },
                      backgroundColor: "var(--color-surface) !important",
                    }}
                  />
                ))}
              </Box>
            )}
          >
            {options.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label ? option.label : option.value}
              </MenuItem>
            ))}
          </Select>
        ) : (
          // Single selection
          <Select
            labelId={id + "_label"}
            id={id}
            value={value}
            onChange={handleChange}
            label={label}
            MenuProps={menuProps}
          >
            {options.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label ? option.label : option.value}
              </MenuItem>
            ))}
          </Select>
        )}
      </FormControl>
    </div>
  );
}
