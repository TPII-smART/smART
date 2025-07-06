import { ReactNode } from "react";
import { CommonInputProps, IntegerVariant } from "..";

export type InputBaseProps = {
  /**
   * Indicates whether the input is in an error state.
   */
  error?: boolean;

  /**
   * Element to display before the input (e.g., an icon or label).
   */
  prefix?: ReactNode;

  /**
   * Element to display after the input (e.g., an icon or button).
   */
  suffix?: ReactNode;

  /**
   * If true, the input will be refocused after certain actions.
   */
  reFocus?: boolean;

  /**
   * Maximum number of characters allowed in the input.
   */
  maxLength?: number;

  /**
   * Visual style variant of the input.
   * - "default": Standard appearance.
   * - "background": Input with background styling.
   */
  variant?: "default" | "background";

  /**
   * Current value of the input.
   */
  value: string;

  /**
   * Callback fired when the input value changes.
   * @param newValue - The updated value of the input.
   */
  onChange: (newValue: string) => void;

  /**
   * Callback fired when the input loses focus.
   */
  onBlur?: () => void;

  /**
   * Name attribute for the input element.
   */
  name?: string;

  /**
   * Placeholder text displayed when the input is empty.
   */
  placeholder?: string;

  /**
   * If true, the input will be disabled and not editable.
   */
  disabled?: boolean;
};

export type IntegerInputProps = CommonInputProps<string> & {
  /**
   * The variant of the integer input.
   * Determines how the input value is interpreted and validated.
   * - `UINT256`: Unsigned 256-bit integer.
   * - `INT256`: Signed 256-bit integer.
   * - `UINT8`: Unsigned 8-bit integer.
   * - `INT8`: Signed 8-bit integer.
   * - `UINT16`: Unsigned 16-bit integer.
   * - `INT16`: Signed 16-bit integer.
   * - `UINT32`: Unsigned 32-bit integer.
   * - `INT32`: Signed 32-bit integer.
   * - `UINT64`: Unsigned 64-bit integer.
   * - `INT64`: Signed 64-bit integer.
   * - `UINT128`: Unsigned 128-bit integer.
   * - `INT128`: Signed 128-bit integer.
   */
  variant?: IntegerVariant;
  /**
   * If true, the input will not have a button to multiply the value by 1e18.
   * This is useful for cases where the input is not meant to represent a value in wei (the smallest unit of Ether).
   * By default, the input will have this button to facilitate conversion to wei.
   * Set this to true to disable the button.
   */
  disableMultiplyBy1e18?: boolean;
};
