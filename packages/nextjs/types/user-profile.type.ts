import { Gig } from "./gig/gig.types";
import { Job } from "./job/job.types";
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
  jobRatings: {
    [rank: number]: number;
  };
  gigRatings: {
    [rank: number]: number;
  };
  averageRating: number;
  totalRatings: number;
}

export function newRatingData(jobs: Job[], gigs: Gig[]): RatingData {
  const jobRatings: { [rank: number]: number } = {};
  const gigRatings: { [rank: number]: number } = {};
  let totalJobRatings = 0;
  let totalGigRatings = 0;
  let totalRatings = 0;

  jobs.forEach(job => {
    if (job.rating === undefined) return;
    const rank = job.rating;
    jobRatings[rank] = (jobRatings[rank] || 0) + 1;
    totalJobRatings += rank;
    totalRatings += 1;
  });

  gigs.forEach(gig => {
    if (gig.rating === undefined) return;
    const rank = gig.rating;
    gigRatings[rank] = (gigRatings[rank] || 0) + 1;
    totalGigRatings += rank;
    totalRatings += 1;
  });

  return {
    jobRatings,
    gigRatings,
    averageRating: totalRatings > 0 ? (totalJobRatings + totalGigRatings) / totalRatings : 0,
    totalRatings,
  };
}
