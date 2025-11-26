import { FocusEvent, useEffect, useRef } from "react";
import { InputBaseProps } from "./types";
import TextField from "@mui/material/TextField";

const _sx = (variant: Pick<InputBaseProps, "variant">["variant"], error: boolean) => {
  const shared = {
    "& .MuiInputBase-root": {
      color: "var(--color-primary-content)",
      "::before": {
        borderBottomColor: error ? "var(--color-error)" : "var(--color-primary-content)",
      },
      "::after": {
        borderBottomColor: error ? "var(--color-error)" : "var(--color-accent)",
      },
    },
    "& .MuiInputLabel-root": {
      color: error ? "var(--color-error)" : "var(--color-secondary-content)",
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: error ? "var(--color-error)" : "var(--color-accent)",
    },
    "&:hover .MuiInputBase-root:not(.Mui-disabled)": {
      color: "var(--color-primary-content)",
      borderBottomColor: error ? "var(--color-error)" : "var(--color-accent)",
      "::before": {
        borderBottomColor: error ? "var(--color-error)" : "var(--color-accent)",
      },
    },
    "&:hover .MuiInputBase-root": {
      color: "var(--color-primary-content)",
      borderBottomColor: error ? "var(--color-error)" : "var(--color-accent)",
      "::before": {
        borderBottomColor: error ? "var(--color-error)" : "var(--color-accent)",
      },
    },
    "&:hover .MuiInputLabel-root": {
      color: error ? "var(--color-error)" : "var(--color-accent)",
    },
    // ----   Filled    --------
    "& .MuiFilledInput-root": {
      backgroundColor: "var(--color-surface)",
      "&:hover .MuiInputBase-root": {
        color: "var(--color-primary-content)",
        "::before": {
          borderBottomColor: error ? "var(--color-error)" : "var(--color-accent)",
        },
      },
    },
    // ------ Outlined --------
    "& .MuiOutlinedInput-root": {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: error ? "var(--color-error)" : "var(--color-primary-content)",
      },
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: error ? "var(--color-error)" : "var(--color-accent)",
      },
      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
        borderColor: error ? "var(--color-error)" : "var(--color-accent)",
      },
    },
  };

  if (variant === "standard") {
    return {
      ...shared,
      "& .MuiInputBase-root": {
        ...shared["& .MuiInputBase-root"],
        pr: 1,
        pl: 1,
      },
      "& .MuiInputLabel-root": {
        ...shared["& .MuiInputLabel-root"],
        pr: 1.2,
        pl: 1.2,
      },
    };
  }

  return shared;
};

export const InputBase = ({
  name,
  value,
  onChange,
  placeholder,
  error,
  prefix,
  suffix,
  reFocus,
  maxLength,
  variant = "standard",
  readOnly = false,
  ...props
}: InputBaseProps) => {
  const inputReft = useRef<HTMLInputElement>(null);

  const onFocus = (e: FocusEvent<HTMLInputElement, Element>) => {
    if (reFocus !== undefined) {
      e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length);
    }
  };
  useEffect(() => {
    if (reFocus !== undefined && reFocus) inputReft.current?.focus();
  }, [reFocus]);

  return (
    <TextField
      {...props}
      name={name}
      value={value}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      placeholder={
        typeof placeholder === "string" ? placeholder : typeof props.label === "string" ? props.label : undefined
      }
      label={props.label ? props.label : placeholder}
      error={!!error}
      helperText={!!error ? props.helperText : undefined}
      onFocus={onFocus}
      margin="normal"
      variant={variant}
      InputProps={{
        startAdornment: prefix && (
          <div className={`mr-2 ${variant === "filled" ? "place-self-end pb-2" : ""}`}>{prefix}</div>
        ),
        endAdornment: suffix && (
          <div className={`ml-2 ${variant === "filled" ? "place-self-end pb-3" : ""}`}>{suffix}</div>
        ),
        readOnly,
        inputProps: {
          maxLength,
        },
      }}
      sx={_sx(variant, !!error)}
      fullWidth
    />
  );
};
