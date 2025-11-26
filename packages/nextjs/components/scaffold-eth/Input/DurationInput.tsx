import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { InputBase } from "..";
import { InputBaseProps } from "./types";
import ComboBox from "~~/components/ComboBox/ComboBox";

// --- Conversion Constants ---
const HOURS_PER_DAY = 24; // 86400
const HOURS_PER_WEEK = HOURS_PER_DAY * 7;
const HOURS_PER_MONTH = HOURS_PER_DAY * 30;
const HOURS_PER_YEAR = HOURS_PER_DAY * 365;

// Ordered from smallest to largest unit for display logic
const UNITS = [
  { label: "Hours", id: "h", hours: 1 },
  { label: "Days", id: "d", hours: HOURS_PER_DAY },
  { label: "Weeks", id: "w", hours: HOURS_PER_WEEK },
  { label: "Months", id: "m", hours: HOURS_PER_MONTH },
  { label: "Years", id: "y", hours: HOURS_PER_YEAR },
];

// Define the component's props
interface DurationInputProps extends Omit<InputBaseProps, "value" | "onChange" | "suffix" | "type"> {
  /** The total duration in hours. */
  value: string;
  /** Callback to update the value, receiving the new total duration in hours. */
  onChange: (newHours: string) => void;
  /** Label for the input field. */
  label?: string;
}

/**
 * A component allowing the user to input a numeric value and select a unit (Y/M/W/D/H),
 * which is then converted back to total hours via the onChange prop.
 */
export const DurationInput = ({
  value,
  onChange,
  label = "Duration",
  variant = "standard",
  ...props
}: DurationInputProps) => {
  // Internal state for the currently displayed quantity and unit
  const [quantity, setQuantity] = useState<string>(value ?? "1");
  const [displayUnitKey, setDisplayUnitKey] = useState<string>("h");

  // Map to easily look up unit data by key
  const unitMap = useMemo(() => new Map(UNITS.map(u => [u.id, u])), []);

  // Handler for when the user changes the numeric quantity
  const handleQuantityChange = useCallback(
    (eventOrValue: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string) => {
      const newQuantityString = typeof eventOrValue === "string" ? eventOrValue : eventOrValue.target.value;

      const newNumericQuantity = Number(newQuantityString);

      if (!newQuantityString) {
        // If input is cleared, treat as 0 hours
        setQuantity("");
        onChange("");
        return;
      }

      if (newNumericQuantity < 0 || isNaN(newNumericQuantity)) return; // Prevent negative values

      //   3. Get the conversion factor for the current unit
      const currentUnit = unitMap.get(displayUnitKey);

      if (isNaN(newNumericQuantity) || newNumericQuantity < 0 || !currentUnit) {
        // If input is invalid or empty, treat as 0 hours
        onChange("0");
        return;
      }

      setQuantity(newQuantityString);

      // 4. Calculate the new total hours and output
      const newTotalHours = newNumericQuantity * currentUnit.hours;
      onChange(newTotalHours.toString());
    },
    [onChange, displayUnitKey, unitMap],
  );

  // Handler for when the user changes the unit (dropdown)
  const handleUnitChange = useCallback(
    (value: any) => {
      const newUnitKey = value;
      setDisplayUnitKey(newUnitKey);

      // Recalculate and output the total hours using the current quantity and new unit
      const numericQuantity = Number(quantity);
      const newUnit = unitMap.get(newUnitKey);

      if (isNaN(numericQuantity) || numericQuantity < 0 || !newUnit) {
        onChange("0");
        return;
      }

      const newTotalHours = numericQuantity * newUnit.hours;
      onChange(newTotalHours.toString());
    },
    [quantity, unitMap, onChange],
  );

  return (
    <div className="flex items-end">
      <div className="flex-grow">
        <InputBase
          {...props}
          label={label}
          value={quantity}
          onChange={handleQuantityChange}
          type="number"
          variant={variant}
          // The suffix now contains the unit selector
          suffix={
            <ComboBox options={UNITS} id="units" onChange={handleUnitChange} value={displayUnitKey} variant={"text"} />
          }
        />
      </div>
    </div>
  );
};
