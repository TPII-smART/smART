"use client";

import { RefObject, Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import ProfileSkeleton from "./ProfileSkeleton";
import OthersProfile from "./othersProfile";
import OwnProfile from "./ownProfile";
import { useAccount } from "wagmi";
import Spinner from "~~/components/Spinner/Spinner";
import Tabs from "~~/components/Tabs/Tabs";
import { Tab, TabProps } from "~~/components/Tabs/types";
import { fetchUserProfile, fetchUserRatingData } from "~~/services/graphql/fetchers/profile.service";
import { RatingData, UserProfile, newUserProfile } from "~~/types/user-profile.type";

const MyTalentsListing = lazy(() => import("@/components/MyTalentsListing"));
const MyGigsListing = lazy(() => import("@/components/MyGigsListing"));
const ApplicationsListing = lazy(() => import("@/components/ApplicationsListing"));
const HiresListing = lazy(() => import("@/components/HiresListing"));

const tabsOwn: TabProps[] = [
  { id: "talents", label: "Talents" },
  { id: "hires", label: "Hires" },
  { id: "gigs", label: "Gigs" },
  { id: "applications", label: "Applications" },
];

const tabs: TabProps[] = [
  { id: "talents", label: "Talents" },
  { id: "gigs", label: "Gigs" },
];

const getPage = (tab: Tab, userAddress: string, scrollRef: RefObject<HTMLDivElement | null>): React.ReactNode => {
  switch (tab.id) {
    case tabs[0].id:
      return <MyTalentsListing userAddress={userAddress} scrollRef={scrollRef} />;
    case tabs[1].id:
      return <MyGigsListing userAddress={userAddress} scrollRef={scrollRef} />;
  }
};

const getPageOwn = (tab: Tab, userAddress: string, scrollRef: RefObject<HTMLDivElement | null>): React.ReactNode => {
  switch (tab.id) {
    case tabsOwn[0].id:
      return <MyTalentsListing userAddress={userAddress} scrollRef={scrollRef} />;
    case tabsOwn[1].id:
      return <HiresListing userAddress={userAddress} scrollRef={scrollRef} />;
    case tabsOwn[2].id:
      return <MyGigsListing userAddress={userAddress} scrollRef={scrollRef} />;
    case tabsOwn[3].id:
      return <ApplicationsListing userAddress={userAddress} scrollRef={scrollRef} />;
  }
};

const ratingsPlaceholder = {
  hiredTalentRatings: {
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

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="w-full h-full overflow-auto" ref={scrollRef}>
      {loading ? (
        <ProfileSkeleton />
      ) : profileAddress === address && editMode ? (
        <OwnProfile user={user} address={profileAddress} setUser={setUser} onSave={() => setEditMode(false)} />
      ) : (
        <div>
          <div>
            <OthersProfile
              user={user}
              address={profileAddress}
              ratingData={ratingData}
              onEditClick={profileAddress === address ? () => setEditMode(true) : undefined}
            />
          </div>

          <div>
            <div className="sticky top-0 bg-base-100 z-10">
              <div className="flex justify-center">
                <div className="w-full z-[9999]">
                  <Tabs tabs={profileAddress === address ? tabsOwn : tabs} onChange={handleTabChange} />
                </div>
              </div>
            </div>

            <div>
              <Suspense
                fallback={
                  <div className="flex justify-center items-center h-64">
                    <Spinner />
                  </div>
                }
              >
                {profileAddress === address
                  ? getPageOwn(selectedTab, profileAddress, scrollRef)
                  : getPage(selectedTab, profileAddress, scrollRef)}
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
