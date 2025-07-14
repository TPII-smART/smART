// UniversalJobCard.tsx
"use client";

import * as React from "react";
import { Badge } from "../Badge";
import { UniversalJobCardProps } from "./types";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/Card";
import { BlockieAvatar } from "@/components/scaffold-eth";
import { cn } from "@/lib/utils";
import { StarIcon } from "lucide-react";

// UniversalJobCard.tsx

// UniversalJobCard.tsx

// UniversalJobCard.tsx

// UniversalJobCard.tsx

// UniversalJobCard.tsx

// UniversalJobCard.tsx

// UniversalJobCard.tsx

// UniversalJobCard.tsx

// UniversalJobCard.tsx

// UniversalJobCard.tsx

export function UniversalJobCard({
  bannerUrl,
  avatarAddress,
  title,
  description,
  category,
  rating,
  paymentDisplay,
  footerLeft,
  footerRight,
  className,
  ...props
}: UniversalJobCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 ease-in-out",
        "hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02]",
        className,
      )}
      {...props}
    >
      {/* Banner with glassmorphism effect */}
      <div className="relative h-36 w-full overflow-hidden">
        {bannerUrl ? (
          <>
            <img
              src={bannerUrl}
              alt="Banner"
              width={600}
              height={144}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </>
        ) : (
          // Glassmorphism banner when no image
          <div className="h-full w-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-tl from-black/5 to-transparent" />
            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-30">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/10 to-transparent transform rotate-45 scale-150" />
            </div>
          </div>
        )}
      </div>

      <CardHeader className="relative">
        {avatarAddress && (
          <div className="absolute -top-12 right-6 z-10">
            <div className="h-24 w-24 overflow-hidden rounded-full p-1 shadow-lg ring-4 ring-background transition-transform duration-300 group-hover:scale-105">
              <BlockieAvatar address={avatarAddress} size={96} />
            </div>
          </div>
        )}

        <div className={cn("space-y-2", avatarAddress ? "mt-2 pr-28" : "pt-4")}>
          <CardTitle className="transition-colors duration-200">{title}</CardTitle>
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex gap-2">
        {rating !== undefined && (
          <div className="flex items-center gap-1 text-yellow-500">
            <StarIcon className="h-4 w-4 fill-current" />
            <span className="text-sm font-medium">{rating}</span>
          </div>
        )}
        {category && (
          <div className="w-fit">
            <Badge variant="secondary">{category}</Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center">
        <div className="flex items-center">{footerLeft ?? paymentDisplay}</div>
        <div className="flex items-center">{footerRight}</div>
      </CardFooter>
    </Card>
  );
}
