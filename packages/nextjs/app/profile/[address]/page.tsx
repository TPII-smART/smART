"use client";

import { Suspense, lazy, useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import ProfileSkeleton from "./ProfileSkeleton";
import OthersProfile from "./othersProfile";
import OwnProfile from "./ownProfile";
import { useAccount } from "wagmi";
import Button from "~~/components/Button/Button";
import Tabs from "~~/components/Tabs/Tabs";
import { Tab, TabProps } from "~~/components/Tabs/types";
import { fetchUserProfile, fetchUserRatingData } from "~~/services/graphql/fetchers/profile.service";
import { RatingData, UserProfile, newUserProfile } from "~~/types/user-profile.type";

const MyJobPostingsListing = lazy(() => import("@/components/MyJobPostingsListing"));
const MyGigsListing = lazy(() => import("@/components/MyGigsListing"));

const tabs: TabProps[] = [
  { id: "job-postings", label: "Job Postings" },
  { id: "gigs", label: "Gigs" },
];

const getPage = (tab: Tab, userAddress: string): React.ReactNode => {
  switch (tab.id) {
    case tabs[0].id:
      return <MyJobPostingsListing userAddress={userAddress} />;
    case tabs[1].id:
      return <MyGigsListing userAddress={userAddress} />;
  }
};

const ratingsPlaceholder = {
  jobRatings: {
    1: 5,
    2: 4,
    3: 3,
  },
  gigRatings: {
    1: 4,
    2: 5,
    3: 2,
  },
  averageRating: 1.61,
  totalRatings: 23,
};

export default function Profile() {
  const { address } = useAccount();
  const { address: profileAddress }: { address: `0x${string}` } = useParams();
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<UserProfile>(newUserProfile());
  const [ratingData, setRatingData] = useState<RatingData>(ratingsPlaceholder);
  const [editMode, setEditMode] = useState(false);
  const fetchUser = useCallback(async () => {
    if (!address) return;
    if (!profileAddress) return;

    setLoading(true);
    const user = await fetchUserProfile(profileAddress);
    setUser(user ?? newUserProfile());
    const ratingData = await fetchUserRatingData(profileAddress);
    setRatingData(ratingData ?? ratingsPlaceholder);
    setLoading(false);
  }, [address, profileAddress]);

  const [selectedTab, setSelectedTab] = useState<Tab>(tabs[0]);

  const handleTabChange = (id: string | number, label?: string) => {
    setSelectedTab({ id, label: label ?? "" });
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

  return (
    <div className="w-full h-full overflow-auto">
      {loading ? (
        <ProfileSkeleton />
      ) : profileAddress === address && editMode ? (
        <div>
          <OwnProfile user={user} address={profileAddress} setUser={setUser} onSave={() => setEditMode(false)} />
          <div style={{ width: "50%", placeSelf: "center" }}>
            <Tabs tabs={tabs} onChange={handleTabChange} />
          </div>
          <Suspense>{getPage(selectedTab, profileAddress)}</Suspense>
        </div>
      ) : (
        <div>
          <OthersProfile
            user={user}
            address={profileAddress}
            changeEditButton={changeEditMode}
            ratingData={ratingData}
          />
          <div style={{ width: "50%", placeSelf: "center" }}>
            <Tabs tabs={tabs} onChange={handleTabChange} />
          </div>
          <Suspense>{getPage(selectedTab, profileAddress)}</Suspense>
        </div>
      )}
    </div>
  );
}
