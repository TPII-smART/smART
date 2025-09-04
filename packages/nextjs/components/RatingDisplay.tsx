"use client";

import { useState } from "react";
import { RatingData } from "~~/types/user-profile.type";

interface RatingDisplayProps {
  ratingData: RatingData;
  tooltipPosition?: "left" | "right";
}

// Custom star component that can be partially filled
const PartialStar = ({ fillPercentage, className }: { fillPercentage: number; className?: string }) => {
  const clipId = `star-clip-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="relative inline-block">
      <svg width="20" height="20" viewBox="0 0 20 20" className={className}>
        <defs>
          <clipPath id={clipId}>
            <rect x="0" y="0" width={`${fillPercentage}%`} height="100%" />
          </clipPath>
        </defs>
        {/* Background star (outline) */}
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          fill="#555454"
          stroke="#555454"
          strokeWidth="1"
        />
        {/* Filled portion */}
        <path
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
          fill="var(--color-yellow-500)"
          clipPath={`url(#${clipId})`}
        />
      </svg>
    </div>
  );
};

export default function RatingDisplay({ ratingData, tooltipPosition = "right" }: RatingDisplayProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Don't render if no ratings
  if (ratingData.totalRatings === 0) {
    return null;
  }

  const renderStars = (rating: number) => {
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      const fillPercentage = Math.max(0, Math.min(100, (rating - (i - 1)) * 100));

      stars.push(<PartialStar key={i} fillPercentage={fillPercentage} className="w-5 h-5" />);
    }

    return stars;
  };

  const calculateRatingBreakdown = () => {
    const breakdown = [];
    for (let rating = 5; rating >= 1; rating--) {
      const jobCount = ratingData.jobRatings[rating] || 0;
      const gigCount = ratingData.gigRatings[rating] || 0;
      const totalForRating = jobCount + gigCount;

      breakdown.push({
        rating,
        jobCount,
        gigCount,
        totalForRating,
        percentage: (totalForRating / ratingData.totalRatings) * 100,
      });
    }
    return breakdown;
  };

  const breakdown = calculateRatingBreakdown();

  return (
    <div className="relative inline-block">
      <div
        className="flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition-all duration-200 hover:shadow-md hover:scale-105 hover:bg-[var(--color-surface)] border border-transparent hover:border-[var(--color-border)]"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center gap-1">{renderStars(ratingData.averageRating)}</div>
        <span
          className="text-lg font-semibold text-[var(--color-white)]"
          style={{ textShadow: "0 0 4px var(--color-black), 0 0 2px var(--color-black)" }}
        >
          {ratingData.averageRating.toFixed(1)}
        </span>
        <span
          className="text-sm text-[var(--color-white)]"
          style={{ textShadow: "0 0 4px var(--color-black), 0 0 2px var(--color-black)" }}
        >
          ({ratingData.totalRatings.toLocaleString()})
        </span>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className={`absolute mt-2 mb-2 z-50 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg p-4 min-w-[300px] ${tooltipPosition === "left" ? "right-0" : "left-0"}`}
        >
          <div className="space-y-2">
            {breakdown.map(({ rating, jobCount, gigCount, totalForRating }) => (
              <div key={rating} className="flex items-center gap-3 text-sm">
                <span className="w-4 text-right font-medium text-[var(--color-primary-content)]">{rating}</span>
                <div className="flex-1 flex items-center gap-1">
                  <div className="flex-1 rounded-full h-3 overflow-hidden border border-[var(--color-input)]">
                    <div className="h-full flex">
                      {/* Jobs bar */}
                      {jobCount > 0 && (
                        <div
                          className="bg-[var(--color-warning)]"
                          style={{
                            width: `${(jobCount / ratingData.totalRatings) * 100}%`,
                          }}
                        />
                      )}
                      {/* Gigs bar */}
                      {gigCount > 0 && (
                        <div
                          className="bg-[var(--color-accent)]"
                          style={{
                            width: `${(gigCount / ratingData.totalRatings) * 100}%`,
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
                <span className="w-8 text-right text-[var(--color-secondary-content)]">{totalForRating}</span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[var(--color-warning)] rounded"></div>
              <span className="text-[var(--color-primary-content)]">Jobs</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[var(--color-accent)] rounded"></div>
              <span className="text-[var(--color-primary-content)]">Gigs</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
