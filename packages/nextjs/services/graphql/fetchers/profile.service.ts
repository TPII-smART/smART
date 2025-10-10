import { endpoint } from "../config";
import { fetchMyGigRatings } from "./gig/gig.service";
import { fetchMyHiredTalentRatings } from "./hiredTalent/hiredTalent.service";
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

export const getUserAddressByUsernameOrEmail = async (search: string): Promise<string[]> => {
  const query = gql`
    query GetUserAddressByUsernameOrEmail($search: String!) {
      userProfiles(where: { OR: [{ username_contains: $search }, { email_contains: $search }] }) {
        items {
          address
        }
      }
    }
  `;

  const variables = { search };
  const res = await request<{ userProfiles: { items: { address: string }[] } }>(endpoint, query, variables);
  return res.userProfiles.items.map(profile => profile.address);
};

export const fetchUserRatingData = async (address: string) => {
  const hiredTalentRatings = await fetchMyHiredTalentRatings(address);
  const gigRatings = await fetchMyGigRatings(address);

  return newRatingData(hiredTalentRatings.hiredTalents, gigRatings.gigs);
};
