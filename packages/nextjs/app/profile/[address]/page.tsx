"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProfileSkeleton from "./ProfileSkeleton";
import OthersProfile from "./othersProfile";
import OwnProfile from "./ownProfile";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import { fetchUserProfile } from "~~/services/graphql/fetchers/profile.service";
import { UserProfile, newUserProfile } from "~~/types/user-profile.type";

export default function Profile() {
  const { address } = useAccount();
  const { address: profileAddress }: { address: `0x${string}` } = useParams();
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<UserProfile>(newUserProfile());
  const [editMode, setEditMode] = useState(false);
  const fetchUser = useCallback(async () => {
    if (!address) return;
    if (!profileAddress) return;

    setLoading(true);
    const user = await fetchUserProfile(address);
    setUser(user ?? newUserProfile());
    setLoading(false);
  }, [address, profileAddress]);

  const changeEditMode =
    profileAddress === address ? (
      <Button variant="primary" onClick={() => setEditMode(true)}>
        Edit Profile
      </Button>
    ) : undefined;

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="w-full h-full">
      {loading ? (
        <ProfileSkeleton />
      ) : profileAddress === address && editMode ? (
        <OwnProfile user={user} address={profileAddress} setUser={setUser} onSave={() => setEditMode(false)} />
      ) : (
        <OthersProfile user={user} address={profileAddress} changeEditButton={changeEditMode} />
      )}
    </div>
  );
}
