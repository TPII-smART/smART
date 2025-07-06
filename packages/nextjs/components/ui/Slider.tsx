"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

interface PriceRangeSliderProps {
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
  defaultValue?: number;
}

export default function PriceRangeSlider({ min = 0, max = 1, defaultValue = 0, onChange }: PriceRangeSliderProps) {
  const [value, setMaxValue] = useState(defaultValue);
  const [inputValue, setInputValue] = useState("");

  // Calculate appropriate step size based on range
  const range = max - min;
  const step = range <= 1 ? 0.01 : range <= 10 ? 0.1 : range <= 100 ? 1 : 10;

  // Update input when slider value changes
  useEffect(() => {
    setInputValue(value.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tmp = Number(e.target.value);
    setMaxValue(tmp);
    setInputValue("");
    onChange?.(tmp);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow numbers with decimal points
    const value = e.target.value.replace(/[^0-9.]/g, "");
    // Prevent multiple decimal points
    const parts = value.split(".");
    const formattedValue = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : value;

    setInputValue(formattedValue);

    const numValue = Number(formattedValue);
    if (!isNaN(numValue) && numValue <= max && numValue >= min) {
      setMaxValue(numValue);
    }
  };

  const formatPrice = (value: number) => {
    // For small decimal values, show more precision
    if (value < 1) {
      return value.toFixed(3);
    } else if (value < 10) {
      return value.toFixed(2);
    } else {
      return new Intl.NumberFormat("en-US").format(value);
    }
  };

  const getSliderBackground = () => {
    const maxPercent = ((value - min) / (max - min)) * 100;
    return `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${maxPercent}%, #e5e7eb ${maxPercent}%, #e5e7eb 100%)`;
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[var(--color-secondary)] rounded-2xl shadow-lg">
      <div className="space-y-6">
        {/* Slider Container */}
        <div className="relative">
          {/* Price Labels */}
          <div className="flex justify-between items-center mb-4">
            <div className="bg-[var(--color-secondary-content)] text-white px-3 py-1 rounded-md text-sm font-medium">
              Up to {formatPrice(value)} ETH
            </div>
          </div>

          {/* Slider Track */}
          <div className="relative h-2 mb-6 flex items-center">
            {/* Slider Track */}
            <div
              className="absolute w-full h-2 rounded-full pointer-events-none"
              style={{ background: getSliderBackground(), transition: "background 0.2s" }}
            />

            {/* Range Input */}
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={value}
              onChange={handleMaxSliderChange}
              className="w-full h-2 bg-transparent appearance-none cursor-pointer z-10"
              style={{
                outline: "none",
                // Remove default focus ring for better custom styling
              }}
              aria-label="Maximum price"
            />
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Maximum Price</Label>
          <Input
            id="max-price"
            type="text"
            value={inputValue}
            onChange={handleMaxInputChange}
            className="border-0 text-center font-medium"
            placeholder={max.toString()}
          />
        </div>
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }

        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: #3b82f6;
          border: 3px solid white;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
