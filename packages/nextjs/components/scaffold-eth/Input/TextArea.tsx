import { FocusEvent, useEffect, useRef, useState } from "react";
import styles from "./InputBase.module.css";
import { InputBaseProps } from "./types";

export interface TextAreaProps extends Omit<InputBaseProps, "prefix" | "suffix"> {
  rows?: number;
}

export const TextArea = ({
  name,
  value,
  onChange,
  onBlur = () => {},
  placeholder,
  error,
  disabled,
  reFocus,
  maxLength,
  readOnly = false,
  variant = "default",
  rows = 4,
}: TextAreaProps) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  let modifier = "";
  if (error) {
    modifier = "border-error text-error";
  } else if (disabled) {
    modifier = "border-disabled bg-border";
  }

  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => {
    onBlur();
    setIsFocused(false);
  };

  const isLabelActive = isFocused || value;

  // Runs only when reFocus prop is passed, useful for setting the cursor
  // at the end of the input. Example AddressInput
  const onFocus = (e: FocusEvent<HTMLTextAreaElement, Element>) => {
    if (reFocus !== undefined) {
      e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length);
    }
    handleFocus();
  };
  useEffect(() => {
    if (reFocus !== undefined && reFocus === true) textAreaRef.current?.focus();
  }, [reFocus]);

  // Outlined variant classes
  const outlinedWrapper =
    variant === "outlined"
      ? `border rounded-lg px-3 pt-2 pb-3 ${isFocused ? "border-accent" : "border-secondary-content"} bg-transparent`
      : "";

  const outlinedInput = variant === "outlined" ? "bg-transparent px-0" : "";

  // For outlined, label is always fixed above input
  const outlinedLabel =
    variant === "outlined" ? "left-0 -top-8 text-primary-content text-lg bg-[transparent] px-1 z-10" : "";

  return (
    <div className={`relative w-full`}>
      <div
        className={`
            relative 
            w-full 
            flex 
            flex-row 
            ${variant === "outlined" ? "" : "border-b"}
            ${modifier ? modifier : variant === "outlined" ? "" : "focus:border-accent" + (isLabelActive ? " border-primary-content" : " border-secondary-content")}
            focus:outline-none
            ${outlinedWrapper}
          ${readOnly ? "border-0" : ""}
        `}
        style={{
          ...(readOnly ? { caretColor: "transparent" } : {}),
        }}
      >
        <textarea
          rows={rows}
          maxLength={maxLength}
          name={name}
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          autoComplete="off"
          ref={textAreaRef}
          onFocus={onFocus}
          onBlur={handleBlur}
          readOnly={readOnly}
          className={`
                w-full
                px-2
                text-lg
                resize-none
                ${variant === "background" ? "bg-[var(--color-surface)] rounded-t-lg" : ""}
                ${variant === "outlined" ? outlinedInput : "pt-[20px] pb-[2px]"}
                ${modifier ? modifier : isLabelActive ? "text-primary-content" : "text-secondary-content"}
                focus:outline-none
                transition-colors duration-300
                ${modifier}
                ${styles.input}
                ${readOnly ? "cursor-not-allowed border-0" : ""}
            `}
          style={{
            transition: "color 300ms",
            transitionDelay: !isLabelActive ? "300ms" : "0ms",
            ...(readOnly ? { cursor: "default" } : {}),
          }}
          placeholder={!isLabelActive ? placeholder : ""}
        />
        {maxLength && isLabelActive && (
          <span
            className={`flex items-center text-xs ${
              modifier ? modifier : isLabelActive ? "text-primary-content" : "text-secondary-content"
            }`}
          >
            {value?.toString().length}/{maxLength}
          </span>
        )}
      </div>
      {/* The floating label */}
      <label
        className={`
            absolute
            ${variant === "outlined" && isLabelActive ? outlinedLabel : "left-2 top-2 text-lg"}
            pointer-events-none
            ${modifier ? modifier : isLabelActive ? "text-primary-content" : "text-secondary-content"}
            transition-all duration-300
            ${variant !== "outlined" && isLabelActive ? "top-6 transform -translate-y-6 scale-73 origin-top-left" : ""}
        `}
      >
        {placeholder}
      </label>
      {/* Optional: The active line (for the accent color on focus, if not using peer-focus directly on input) */}
      {variant !== "outlined" && (
        <div
          className={`
                        absolute bottom-0 left-0 w-full h-[2px] 
                        ${modifier ? modifier : "bg-accent"}
                        transform scale-x-0
                        transition-transform duration-300 ease-out
                        ${isFocused ? "scale-x-100" : ""}
                    `}
        ></div>
      )}
    </div>
  );
};
