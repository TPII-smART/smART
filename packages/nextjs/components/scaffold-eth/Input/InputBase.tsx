import { ChangeEvent, FocusEvent, ReactNode, useCallback, useEffect, useRef, useState } from "react";
import styles from "./InputBase.module.css";
import { CommonInputProps } from "~~/components/scaffold-eth";

type InputBaseProps<T> = CommonInputProps<T> & {
  error?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
  reFocus?: boolean;
  maxLength?: number;
};

export const InputBase = <T extends { toString: () => string } | undefined = string>({
  name,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  prefix,
  suffix,
  reFocus,
  maxLength,
}: InputBaseProps<T>) => {
  const inputReft = useRef<HTMLInputElement>(null);

  let modifier = "";
  if (error) {
    modifier = "border-error text-error";
  } else if (disabled) {
    modifier = "border-disabled bg-border";
  }
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const isLabelActive = isFocused || value;

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value as unknown as T);
    },
    [onChange],
  );

  // Runs only when reFocus prop is passed, useful for setting the cursor
  // at the end of the input. Example AddressInput
  const onFocus = (e: FocusEvent<HTMLInputElement, Element>) => {
    if (reFocus !== undefined) {
      e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length);
    }
    handleFocus();
  };
  useEffect(() => {
    if (reFocus !== undefined && reFocus === true) inputReft.current?.focus();
  }, [reFocus]);

  return (
    <div className={`relative w-full`}>
      {" "}
      <div
        className={`
          relative 
          w-full 
          flex 
          flex-row 
          border-b
          ${modifier ? modifier : "focus:border-accent" + isLabelActive ? "border-primary-content" : "border-secondary-content"}
          focus:outline-none
        `}
      >
        {isLabelActive && prefix && <div className="place-self-center mr-2 pt-[18px]">{prefix}</div>}
        <input
          maxLength={maxLength}
          name={name}
          value={value?.toString()}
          onChange={handleChange}
          disabled={disabled}
          autoComplete="off"
          ref={inputReft}
          onFocus={onFocus}
          onBlur={handleBlur}
          // Tailwind classes for the input
          className={`
          w-full
          px-0
          pt-[20px]
          pb-[2px]
          text-lg
          bg-transparent
          ${modifier ? modifier : isLabelActive ? "text-primary-content" : "text-secondary-content"}
          focus:outline-none
          transition-colors duration-300
          ${modifier}
          ${styles.input}
          `}
          style={{
            transition: "color 300ms",
            // Placeholder transition: delay showing placeholder by 300ms when !isLabelActive
            transitionDelay: !isLabelActive ? "300ms" : "0ms",
          }}
          // Placeholder style: invisible until 300ms if !isLabelActive
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
        {isLabelActive && suffix && <div className="place-self-center mr-2 pt-[18px]">{suffix}</div>}
      </div>
      {/* The floating label */}
      <label
        className={`
          absolute
          left-0
          top-5
          pointer-events-none
          text-lg
          ${modifier ? modifier : isLabelActive ? "text-primary-content" : "text-secondary-content"}
          transition-all duration-300
          ${
            isLabelActive
              ? "top-6 transform -translate-y-6 scale-73 origin-top-left" // Moved and smaller
              : ""
          }
          `}
      >
        {placeholder}
      </label>
      {/* Optional: The active line (for the accent color on focus, if not using peer-focus directly on input) */}
      <div
        className={`
          absolute bottom-0 left-0 w-full h-[2px] 
          ${modifier ? modifier : "bg-accent"}
          transform scale-x-0
          transition-transform duration-300 ease-out
          ${isFocused ? "scale-x-100" : ""}
        `}
      ></div>
    </div>
  );
};
