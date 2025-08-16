"use client";

import * as React from "react";
import Image from "next/image";
import { Badge } from "../Badge";
import { jobCategories } from "./JobCategory/jobCategory.data";
import { UniversalCardProps } from "./types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { BlockieAvatar } from "@/components/scaffold-eth";
import { cn } from "@/lib/utils";
import { resolveIPFSHash } from "@services/IPFS/thirdwebIPFS";
import { ClockIcon, DocumentDuplicateIcon, StarIcon } from "@heroicons/react/24/outline";
import { useUserProfile } from "~~/hooks/use-user-profile";

// Component for displaying time information
const TimeDisplay = ({
  time,
  timeLabel,
  className,
}: {
  time?: string | number;
  timeLabel?: string;
  className?: string;
}) => {
  if (!time) return null;

  return (
    <div
      className={cn("flex items-center gap-1.5 text-sm text-muted-foreground relative cursor-help", className)}
      title={timeLabel ? `${timeLabel}: ${time} hrs` : undefined}
    >
      <span className="select-none pointer-events-none">{time} hrs</span>
      <ClockIcon className="h-4 w-4" />
    </div>
  );
};

// Component for displaying rating
const RatingDisplay = ({ rating, className }: { rating?: number; className?: string }) => {
  if (rating === undefined) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="text-sm font-medium text-yellow-600">{rating}</span>
      <StarIcon className="h-4 w-4 fill-yellow-500 text-yellow-500" />
    </div>
  );
};

// Component for displaying category badge
const CategoryDisplay = ({ category, className }: { category?: string; className?: string }) => {
  if (!category) return null;

  return (
    <div className={cn("w-fit", className)}>
      <Badge variant="secondary">{jobCategories.find(c => c.id === category)?.label ?? category}</Badge>
    </div>
  );
};

// Main metadata row component
const MetadataRow = ({
  rating,
  category,
  time,
  timeLabel,
  extraInfo,
  className,
}: {
  rating?: number;
  category?: string;
  time?: string | number;
  timeLabel?: string;
  extraInfo?: React.ReactNode;
  className?: string;
}) => {
  const hasContent = rating !== undefined || category || time || extraInfo;

  if (!hasContent) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-3", className)}>
      <TimeDisplay time={time} timeLabel={timeLabel} />
      <CategoryDisplay category={category} />
      <RatingDisplay rating={rating} />
      {extraInfo && <span className="text-sm text-muted-foreground">{extraInfo}</span>}
    </div>
  );
};

export function UniversalCard({
  bannerUrl,
  avatarAddress,
  customAvatar,
  title,
  description,
  extraInfo,
  category,
  rating,
  time,
  timeLabel,
  paymentDisplay,
  footerLeft,
  footerRight,
  className,
  ...props
}: UniversalCardProps) {
  const { profilePicture, isLoading } = useUserProfile(avatarAddress);

  const handleCopyAddress = async () => {
    if (avatarAddress) {
      try {
        await navigator.clipboard.writeText(avatarAddress);
      } catch (err) {
        console.error("Failed to copy address:", err);
      }
    }
  };

  const bannerUri = bannerUrl ? resolveIPFSHash(bannerUrl) : undefined;

  const renderAvatar = () => {
    // Prioridad: customAvatar > profilePicture (del fetch) > BlockieAvatar
    const imageToShow = customAvatar || profilePicture;

    if (imageToShow) {
      return (
        <Image
          src={typeof imageToShow === "string" ? imageToShow : ""}
          width={96}
          height={96}
          alt="User avatar"
          className="h-24 w-24 rounded-full object-cover"
          onError={e => {
            // ✅ Fallback al BlockieAvatar si la imagen falla
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = "block";
          }}
        />
      );
    }

    if (isLoading) {
      return <div className="h-24 w-24 rounded-full bg-gray-300 animate-pulse" />;
    }

    return <BlockieAvatar address={avatarAddress ? avatarAddress : ""} size={96} />;
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 ease-in-out",
        // Only shadow and translate on hover, not scale or blur
        "hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] h-full flex flex-col",
        className,
      )}
      {...props}
    >
      {/* Banner with glassmorphism effect */}
      <div className="relative h-36 w-full overflow-hidden">
        {bannerUri ? (
          <>
            <div className="h-full w-full relative">
              <Image
                src={bannerUri}
                alt="Banner"
                width={600}
                height={144}
                className="h-full w-full object-cover transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:blur-[3px]"
                style={{ willChange: "transform, filter" }}
              />
              {/* Overlay for better text readability, not blurred */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </>
        ) : (
          // Glassmorphism banner when no image
          <div
            className="h-full w-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:blur-[3px]"
            style={{ willChange: "transform, filter" }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tl from-black/5 to-transparent" />
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform rotate-45 scale-150" />
            </div>
          </div>
        )}
      </div>

      <CardHeader className="relative overflow-visible pb-4">
        {avatarAddress && (
          <div className="absolute -top-18 right-6 z-20 group/avatar">
            <div
              className="h-24 w-24 rounded-full transition-all duration-300 group-hover:scale-105 relative cursor-pointer"
              onClick={handleCopyAddress}
            >
              {renderAvatar()}
              {/* TODO: Go to profile page on click, for now just copy address */}
              {/* Hover overlay with darkening effect and copy icon */}
              <div className="absolute inset-0 rounded-full bg-black/0 group-hover/avatar:bg-black/40 transition-all duration-300 flex items-center justify-center">
                <DocumentDuplicateIcon className="h-6 w-6 text-white opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300" />
              </div>
              {/* Address tooltip that slides up from avatar */}
              <div className="absolute -top-12 right-0 opacity-0 group-hover/avatar:opacity-100 transition-all duration-300 ease-out translate-y-2 group-hover/avatar:translate-y-0 z-30 pointer-events-none">
                <div className="bg-black/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap font-mono shadow-lg backdrop-blur-sm">
                  {avatarAddress}
                  {/* Arrow pointing down to avatar */}
                  <div className="absolute -bottom-1 right-6 w-2 h-2 bg-black/90 rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      {/* Content section */}
      <CardContent className="flex-1 px-6 pb-4">
        <div className="space-y-4">
          {/* Title and Description Section */}
          <div className="space-y-3">
            <CardTitle className="text-lg font-semibold leading-tight line-clamp-2" style={{ minHeight: "2.5rem" }}>
              {title}
            </CardTitle>

            <CardDescription className="text-sm leading-relaxed line-clamp-3">{description}</CardDescription>
          </div>

          {/* Metadata Section */}
          <MetadataRow
            rating={rating}
            category={category}
            time={time}
            timeLabel={timeLabel}
            extraInfo={extraInfo}
            className="pt-2"
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center px-6 py-4 mt-auto">
        <div className="flex items-center">{footerLeft ?? paymentDisplay}</div>
        <div className="flex items-center">{footerRight}</div>
      </CardFooter>
    </Card>
  );
}
