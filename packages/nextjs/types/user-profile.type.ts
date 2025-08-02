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
