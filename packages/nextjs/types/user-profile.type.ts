import { Gig } from "./gig/gig.types";
import { HiredTalent } from "./hiredTalent/hiredTalent.types";
import { Address } from "viem";

export interface UserProfile {
  address: Address;
  username: string;
  biography: string;
  email: string;
  profilePicture: string;
  bannerPicture: string;
  xUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  artstationUrl: string;
  sketchfabUrl: string;
  customUrl: string;
}

export function newUserProfile(): UserProfile {
  return {
    address: "",
    username: "",
    biography: "",
    email: "",
    profilePicture: "",
    bannerPicture: "",
    xUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    artstationUrl: "",
    sketchfabUrl: "",
    customUrl: "",
  } as UserProfile;
}

export interface RatingData {
  hiredTalentRatings: {
    [rank: number]: number;
  };
  gigRatings: {
    [rank: number]: number;
  };
  averageRating: number;
  totalRatings: number;
}

export function newRatingData(hiredTalents: HiredTalent[], gigs: Gig[]): RatingData {
  const hiredTalentRatings: { [rank: number]: number } = {};
  const gigRatings: { [rank: number]: number } = {};
  let totalHiredTalentRatings = 0;
  let totalGigRatings = 0;
  let totalRatings = 0;

  hiredTalents.forEach(hiredTalent => {
    if (hiredTalent.rating === null || hiredTalent.rating === undefined) return;
    const rank = hiredTalent.rating;
    hiredTalentRatings[rank] = (hiredTalentRatings[rank] || 0) + 1;
    totalHiredTalentRatings += rank;
    totalRatings += 1;
  });

  gigs.forEach(gig => {
    if (gig.rating === null || gig.rating === undefined) return;
    const rank = gig.rating;
    gigRatings[rank] = (gigRatings[rank] || 0) + 1;
    totalGigRatings += rank;
    totalRatings += 1;
  });

  return {
    hiredTalentRatings,
    gigRatings,
    averageRating: totalRatings > 0 ? (totalHiredTalentRatings + totalGigRatings) / totalRatings : 0,
    totalRatings,
  };
}
