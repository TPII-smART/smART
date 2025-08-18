import React, { useState } from "react";
import { useField } from "formik";
import { StarIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";

interface RatingStarsProps {
  name: string;
  value?: number;
  onChange?: (rating: number) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
  required?: boolean;
}

export default function RatingStars({
  name,
  value,
  onChange,
  disabled = false,
  size = "lg",
  className,
  label,
  required = false,
}: RatingStarsProps) {
  const [field, meta, helpers] = useField(name);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const currentRating = value ?? field.value ?? 0;
  const displayRating = hoverRating ?? currentRating;

  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const handleStarClick = (rating: number) => {
    if (disabled) return;

    helpers.setValue(rating);
    onChange?.(rating);
  };

  const handleStarHover = (rating: number) => {
    if (disabled) return;
    setHoverRating(rating);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    setHoverRating(null);
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className || ""}`}>
      {label && (
        <label className="text-sm font-medium text-content-primary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="flex items-center justify-center gap-4 relative">
        {displayRating > 0 && (
          <span className="text-lg font-medium text-content-primary absolute left-0 transform -translate-x-8">
            {displayRating}
          </span>
        )}

        <div className="flex items-center gap-1" onMouseLeave={handleMouseLeave}>
          {[1, 2, 3, 4, 5].map(star => {
            const isFilled = star <= displayRating;
            const StarComponent = isFilled ? StarIconSolid : StarIcon;

            return (
              <button
                key={star}
                type="button"
                disabled={disabled}
                onClick={() => handleStarClick(star)}
                onMouseEnter={() => handleStarHover(star)}
                className={`
                  relative transition-all duration-200 focus:outline-none rounded
                  ${!disabled ? "hover:scale-110 cursor-pointer" : "cursor-not-allowed opacity-60"}
                  ${sizeClasses[size]}
                `}
                aria-label={`Rate ${star} star${star !== 1 ? "s" : ""}`}
              >
                <StarComponent
                  className={`
                    transition-all duration-200
                    ${isFilled ? "drop-shadow-sm" : "text-gray-300 hover:text-gray-400"}
                    ${sizeClasses[size]}
                  `}
                  style={{
                    color: isFilled ? "var(--color-accent)" : undefined,
                  }}
                />
                {isFilled && (
                  <div className="absolute inset-0 animate-pulse">
                    <StarComponent
                      className={`opacity-50 ${sizeClasses[size]}`}
                      style={{ color: "var(--color-accent)" }}
                    />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {meta.touched && meta.error && <div className="text-sm text-red-500">{meta.error}</div>}
    </div>
  );
}
