import { useQuery } from "@tanstack/react-query";
import { getAddress } from "viem";
import { fetchUserProfile } from "~~/services/graphql/fetchers/profile.service";
import { UserProfile } from "~~/types/user-profile.type";

const normalizeAddress = (address?: string): string | null => {
  if (!address) return null;

  try {
    return getAddress(address); // Convierte a checksum format
  } catch (error) {
    console.warn("Invalid Ethereum address:", address);
    console.error(error);
    return null;
  }
};

export const useUserProfile = (address?: string) => {
  const normalizedAddress = normalizeAddress(address);

  const {
    data: userProfile,
    isLoading,
    error,
  } = useQuery<UserProfile>({
    queryKey: ["userProfile", normalizedAddress],
    queryFn: async () => {
      if (!normalizedAddress) throw new Error("Invalid address");
      const result = await fetchUserProfile(normalizedAddress);
      return result;
    },
    enabled: !!normalizedAddress,
  });
  return {
    userProfile,
    isLoading,
    error,
    profilePicture: userProfile?.profilePicture,
    username: userProfile?.username,
  };
};
