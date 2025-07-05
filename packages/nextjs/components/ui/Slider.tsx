"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Button from "@/components/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

interface PriceRangeSliderProps {
  min?: number;
  max?: number;
  defaultMax?: number;
  onSearch?: (min: number, max: number) => void;
}

export default function PriceRangeSlider({ min = 0, max = 1, defaultMax = 0.5, onSearch }: PriceRangeSliderProps) {
  const [maxValue, setMaxValue] = useState(defaultMax);
  const [maxInput, setMaxInput] = useState(defaultMax.toString());

  // Calculate appropriate step size based on range
  const range = max - min;
  const step = range <= 1 ? 0.001 : range <= 10 ? 0.01 : range <= 100 ? 0.1 : 1;

  // Update input when slider value changes
  useEffect(() => {
    setMaxInput(maxValue.toString());
  }, [maxValue]);

  const handleMaxSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setMaxValue(value);
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow numbers with decimal points
    const value = e.target.value.replace(/[^0-9.]/g, "");
    // Prevent multiple decimal points
    const parts = value.split(".");
    const formattedValue = parts.length > 2 ? parts[0] + "." + parts.slice(1).join("") : value;

    setMaxInput(formattedValue);

    const numValue = Number(formattedValue);
    if (!isNaN(numValue) && numValue <= max && numValue >= min) {
      setMaxValue(numValue);
    }
  };

  const handleMaxInputBlur = () => {
    const numValue = Number(maxInput);
    if (isNaN(numValue) || numValue > max || numValue < min) {
      setMaxInput(maxValue.toString());
    } else {
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
    const maxPercent = ((maxValue - min) / (max - min)) * 100;
    return `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${maxPercent}%, #e5e7eb ${maxPercent}%, #e5e7eb 100%)`;
  };

  const handleSearch = () => {
    onSearch?.(min, maxValue);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-[var(--color-secondary)] rounded-2xl shadow-lg">
      <div className="space-y-6">
        {/* Slider Container */}
        <div className="relative">
          {/* Price Labels */}
          <div className="flex justify-between items-center mb-4">
            <div className="bg-[var(--color-secondary-content)] text-white px-3 py-1 rounded-md text-sm font-medium">
              Up to {formatPrice(maxValue)} ETH
            </div>
          </div>

          {/* Slider Track */}
          <div className="relative h-2 mb-6">
            <div className="absolute w-full h-2 rounded-full" style={{ background: getSliderBackground() }} />

            {/* Max Range Input */}
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={maxValue}
              onChange={handleMaxSliderChange}
              className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
            />
          </div>
        </div>

        {/* Input Field */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Maximum Price</Label>
          <Input
            id="max-price"
            type="text"
            value={maxInput}
            onChange={handleMaxInputChange}
            onBlur={handleMaxInputBlur}
            className="border-0 text-center font-medium"
            placeholder={max.toString()}
          />
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-lg"
          variant={"primary"}
        >
          Search
        </Button>
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
