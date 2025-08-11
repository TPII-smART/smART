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
import { DocumentDuplicateIcon, StarIcon } from "@heroicons/react/24/outline";
import { useUserProfile } from "~~/hooks/use-user-profile";

export function UniversalCard({
  bannerUrl,
  avatarAddress,
  customAvatar,
  title,
  description,
  extraInfo,
  category,
  rating,
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
        // You could add a toast notification here
      } catch (err) {
        console.error("Failed to copy address:", err);
      }
    }
  };

  // ! Cambiar junto con el contract por bannerHash y en los lugares que corresponda, porque ahora guardamos el hash del IPFS !
  const bannerUri = bannerUrl ? resolveIPFSHash(bannerUrl) : undefined;

  const renderAvatar = () => {
    // Prioridad: customAvatar > profilePicture (del fetch) > BlockieAvatar
    const imageToShow = customAvatar || profilePicture;

    if (imageToShow) {
      return (
        <Image
          src={typeof imageToShow === "string" ? imageToShow : ""}
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
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 group-hover:blur-sm"
                style={{ willChange: "transform, filter" }}
              />
              {/* Overlay for better text readability, not blurred */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </>
        ) : (
          // Glassmorphism banner when no image
          <div
            className="h-full w-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:blur-sm"
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

      <CardHeader className="relative overflow-visible">
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

      <CardContent className="space-y-3 h-60">
        <div className={cn("space-y-2 h-7/12", avatarAddress ? "mt-2" : "pt-4")}>
          <CardTitle
            className="transition-colors duration-200 h-5/12 max-h-5/12 text-justify overflow-hidden text-ellipsis"
            style={{ lineHeight: "1.15" }}
          >
            {title}
          </CardTitle>
          <CardDescription className="whitespace-normal h-7/12 max-h-7/12 text-ellipsis line-clamp-4">
            {description}
          </CardDescription>
        </div>
        {extraInfo && <span className="relative text-sm text-muted-foreground">{extraInfo}</span>}
        <div className="flex gap-3 items-center">
          {rating !== undefined && (
            <div className="flex items-center gap-1 text-yellow-500">
              <StarIcon className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">{rating}</span>
            </div>
          )}
          {category && (
            <div className="w-fit">
              <Badge variant="secondary">{jobCategories.find(c => c.id === category)?.label ?? category}</Badge>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between items-center h-2/12">
        <div className="flex items-center">{footerLeft ?? paymentDisplay}</div>
        <div className="flex items-center">{footerRight}</div>
      </CardFooter>
    </Card>
  );
}
