import * as React from "react";
import { ComboBoxProps } from "./types";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { SxProps } from "@mui/material/styles";
import { Box, Theme } from "@mui/system";

const _style: React.CSSProperties = {
  width: "100%",
  minWidth: "120px",
  margin: "1px",
};

const _sx: SxProps<Theme> = {
  "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "var(--color-accent)",
  },
  ".MuiSelect-select": {
    color: "var(--color-primary-content)",
  },
  "& .MuiFormLabel-root": {
    color: "var(--color-secondary-content) !important",
    fontSize: "var(--text-lg)",
  },
  "& .MuiFormLabel-root-focused": {
    color: "var(--color-primary-content) !important",
  },
  "& .MuiInputLabel-shrink": {
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
                        marginBottom: "2px",
                      },
                      backgroundColor: "var(--color-surface) !important",
                    }}
                  />
                ))}
              </Box>
            )}
          >
            {options.map(option => (
              <MenuItem key={option.id} value={option.id}>
                {option.label ? option.label : option.id}
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
            className="text-lg"
            sx={{
              "& .MuiSelect-select": {
                py: "4px",
                fontSize: "var(--text-lg)",
              },
            }}
          >
            {options.map(option => (
              <MenuItem key={option.id} value={option.id}>
                {option.label ? option.label : option.id}
              </MenuItem>
            ))}
          </Select>
        )}
      </FormControl>
    </div>
  );
}
