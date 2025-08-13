"use client";

import React, { useEffect, useState } from "react";
import { SliderProps } from "./types";
import Slider from "@mui/material/Slider";
import { styled } from "@mui/material/styles";

interface InputBaseProps {
  variant: "background";
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

// A simple, self-contained InputBase component to resolve the import error
const InputBase = ({ variant, value, onChange, placeholder }: InputBaseProps) => {
  const baseClasses =
    "w-full px-4 py-2 text-sm rounded-lg border border-[var(--color-surface)] focus:outline-none focus:ring-2 focus:ring-accent";
  const variantClasses = variant === "background" ? "bg-[var(--color-surface)] text-white placeholder-gray-400" : "";

  return (
    <input
      className={`${baseClasses} ${variantClasses}`}
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};

// Custom styled Slider to use Tailwind colors and styles directly
const StyledSlider = styled(Slider)(() => ({
  color: "var(--color-accent)", // Golden accent color
  height: 8,
  "& .MuiSlider-track": {
    border: "none",
    height: 8,
    borderRadius: 4,
  },
  "& .MuiSlider-rail": {
    color: "#374151", // Tailwind gray-700
  },
  "& .MuiSlider-thumb": {
    height: 20,
    width: 20,
    backgroundColor: "var(--color-accent)",
    border: "2px solid white",
    boxShadow: "0px 0px 4px 2px rgba(252, 144, 3, 0.4)",
    "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
      boxShadow: "0px 0px 6px 3px rgba(252, 144, 3, 0.6)",
    },
  },
}));

export default function PriceRangeSlider({ min = 0, max = 1, defaultValue = [0, 1], onChange }: SliderProps) {
  const [value, setValue] = useState<number[]>(defaultValue);

  // Calculate appropriate step size based on range
  const range = max - min;
  const step = range <= 1 ? 0.01 : range <= 10 ? 0.1 : range <= 100 ? 1 : 10;

  useEffect(() => {
    // Sync the value if defaultValue changes
    setValue(defaultValue);
  }, [defaultValue]);

  const handleSliderChange = (event: Event, newValue: number | number[]) => {
    setValue(newValue as number[]);
    onChange?.(newValue as number[]);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const newValue = [...value];
    const stringValue = event.target.value.replace(/[^0-9.]/g, "");
    let numValue = Number(stringValue);

    if (isNaN(numValue) || stringValue.endsWith(".")) {
      // Don't update the slider if it's not a valid number yet (e.g., just a decimal point)
      return;
    }

    if (index === 0) {
      // Min value
      numValue = numValue < min ? min : numValue > newValue[1] ? newValue[1] : numValue;
      newValue[0] = numValue;
    } else {
      // Max value
      numValue = numValue > max ? max : numValue < newValue[0] ? newValue[0] : numValue;
      newValue[1] = numValue;
    }

    setValue(newValue);
    onChange?.(newValue);
  };

  const formatPrice = (price: number) => {
    if (price < 1) {
      return price.toFixed(3);
    } else if (price < 1000) {
      return price.toFixed(2);
    } else {
      return new Intl.NumberFormat("en-US").format(price);
    }
  };

  return (
    <div className="w-full bg-secondary rounded-lg p-0 border border-gray-700 shadow-md transition-all duration-300">
      {/* Collapsible Content */}
      <div className={`overflow-hidden transition-all duration-300 max-h-96`}>
        <div className="px-4 pb-4">
          {/* Price Labels */}
          <div className="flex justify-center items-center mt-2 mb-4">
            <div className="bg-[var(--color-surface)] text-primary-content px-3 py-1 rounded-md text-sm font-bold shadow-sm">
              {formatPrice(value[0])} - {formatPrice(value[1])} ETH
            </div>
          </div>

          {/* Slider */}
          <div className="px-1">
            <StyledSlider
              value={value}
              min={min}
              max={max}
              step={step}
              onChange={handleSliderChange}
              aria-label="Price range slider"
            />
          </div>

          {/* Min/Max Input Fields */}
          <div className="flex justify-between items-center gap-2 mt-4">
            <div className="flex-1">
              <InputBase
                variant="background"
                value={value[0].toString()}
                onChange={e => handleInputChange(e, 0)}
                placeholder="Min Price"
              />
            </div>
            <div className="flex-1">
              <InputBase
                variant="background"
                value={value[1].toString()}
                onChange={e => handleInputChange(e, 1)}
                placeholder="Max Price"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
