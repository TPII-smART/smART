"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProfileSkeleton from "./ProfileSkeleton";
import OthersProfile from "./othersProfile";
import OwnProfile from "./ownProfile";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import { useUserProfile } from "~~/context/UserProfileContext";
import { fetchUserProfile } from "~~/services/graphql/fetchers/profile.service";
import { UserProfile, newUserProfile } from "~~/types/user-profile.type";

export default function Profile() {
  const { address } = useAccount();
  const { address: profileAddress } = useParams();
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [localUser, setLocalUser] = useState<UserProfile>(newUserProfile());
  const { userProfile, setUserProfile } = useUserProfile();

  const fetchUser = useCallback(async () => {
    if (!address) return;
    if (!profileAddress) return;

    setLoading(true);
    try {
      const fetchedUser = await fetchUserProfile(address);
      const userData = fetchedUser ?? newUserProfile();

      setLocalUser(userData);
      setUserProfile(userData);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      const emptyProfile = newUserProfile();
      setLocalUser(emptyProfile);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  }, [address, profileAddress, setUserProfile]);

  const handleUserUpdate = (value: UserProfile | ((prevState: UserProfile) => UserProfile)) => {
    const updatedUser = typeof value === "function" ? value(localUser) : value;
    setLocalUser(updatedUser);
    setUserProfile(updatedUser);
  };

  const changeEditMode =
    profileAddress === address ? (
      <Button variant="primary" onClick={() => setEditMode(true)}>
        Edit Profile
      </Button>
    ) : undefined;

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const displayUser = userProfile || localUser;

  return (
    <div className="w-full h-full">
      {loading ? (
        <ProfileSkeleton />
      ) : profileAddress === address && editMode ? (
        <OwnProfile user={displayUser} setUser={handleUserUpdate} onSave={() => setEditMode(false)} />
      ) : (
        <OthersProfile user={displayUser} changeEditButton={changeEditMode} />
      )}
    </div>
  );
}
