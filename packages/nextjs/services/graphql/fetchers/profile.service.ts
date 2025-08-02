import { endpoint } from "../config";
import request, { gql } from "graphql-request";
import { UserProfile } from "~~/types/user-profile.type";

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
