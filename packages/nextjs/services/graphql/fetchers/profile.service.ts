import { endpoint } from "../config";
import { fetchMyGigRatings } from "./gig/gig.service";
import { fetchMyJobRatings } from "./job/job.service";
import request, { gql } from "graphql-request";
import { UserProfile, newRatingData } from "~~/types/user-profile.type";

export const fetchUserProfile = async (address: string) => {
  const query = gql`
    query GetUserProfile($address: String!) {
      userProfile(address: $address) {
        address
        username
        biography
        email
        profilePicture
        bannerPicture
        xUrl
        instagramUrl
        linkedinUrl
        artstationUrl
        sketchfabUrl
        customUrl
      }
    }
  `;

  const variables = { address };
  const res = await request<{ userProfile: UserProfile }>(endpoint, query, variables);
  return res.userProfile;
};

export const fetchUserRatingData = async (address: string) => {
  const jobRatings = await fetchMyJobRatings(address);
  const gigRatings = await fetchMyGigRatings(address);

  return newRatingData(jobRatings.jobs, gigRatings.gigs);
};
