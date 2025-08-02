import React, { ReactNode, createContext, useContext } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { fetchUserProfile } from "~~/services/graphql/fetchers/profile.service";
import { UserProfile } from "~~/types/user-profile.type";

type UserContextType = {
  savedUser: UserProfile | undefined;
  loadingUser: boolean;
  reloadUser: () => Promise<void>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address } = useAccount();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<UserProfile>({
    queryKey: ["userProfile", address],
    enabled: !!address,
    queryFn: () => fetchUserProfile(address as unknown as string),
  });

  const reload = async () => {
    queryClient.invalidateQueries({ queryKey: ["jobPostings"] });
    await new Promise(resolve => setTimeout(resolve, 1000)); // Delay to ensure UI updates
    await refetch();
  };

  return (
    <UserContext.Provider value={{ savedUser: data, loadingUser: isLoading, reloadUser: reload }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUserContext must be used within UserProvider");
  return context;
};
