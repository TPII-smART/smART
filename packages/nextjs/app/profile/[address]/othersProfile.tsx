"use client";

import { JSX, useMemo } from "react";
import styles from "./Profile.module.css";
import { LinkIcon } from "@heroicons/react/24/outline";
import AvatarImage from "~~/components/AvatarImage/AvatarImage";
import BannerImage from "~~/components/BannerImage/BannerImage";
import RatingDisplay from "~~/components/RatingDisplay";
import ArtStationIcon from "~~/components/assets/Logos/artstation";
import InstagramIcon from "~~/components/assets/Logos/instagram";
import LinkedInIcon from "~~/components/assets/Logos/linkedin";
import SketchfabIcon from "~~/components/assets/Logos/sketchfab";
import XIcon from "~~/components/assets/Logos/x";
import { isImageUrl } from "~~/lib/utils";
import { RatingData, UserProfile } from "~~/types/user-profile.type";

export interface OthersProfileProps {
  user: UserProfile;
  address: `0x${string}`;
  changeEditButton?: JSX.Element;
  ratingData: RatingData;
}

export default function OthersProfile({ user, changeEditButton, address, ratingData }: OthersProfileProps) {
  const hasSocialNetworks = useMemo(() => {
    return (
      user.xUrl || user.instagramUrl || user.linkedinUrl || user.sketchfabUrl || user.artstationUrl || user.customUrl
    );
  }, [user]);

  const isProfileEmpty = useMemo(() => {
    return !user.username && !user.email && !user.biography && !hasSocialNetworks;
  }, [user, hasSocialNetworks]);

  const isRatingEmpty = useMemo(() => {
    return ratingData.totalRatings == 0;
  }, [ratingData]);

  return (
    <div className={styles.profileTab}>
      <div className={styles.profileContainer}>
        <div className="relative">
          <BannerImage
            src={isImageUrl(user.bannerPicture) ? user.bannerPicture : "https://placehold.co/1200x300/1f2937/1f2937"}
            alt="Banner"
            height={192}
            width={"100%"}
          />
          <div className={styles.avatarImage}>
            <div className="relative">
              <AvatarImage
                src={isImageUrl(user.profilePicture) ? user.profilePicture : undefined}
                alt="Profile Picture"
                address={address as `0x${string}`}
              />
            </div>
          </div>
        </div>
        <div className={styles.editButton}>{changeEditButton}</div>
        {isProfileEmpty ? (
          <div className="w-full h-2/3 flex justify-center items-center">
            <span className="text-3xl text-secondary-content text-center">
              {"This profile is empty" + (changeEditButton ? ", click the button to edit it!" : "!")}
            </span>
          </div>
        ) : (
          <div className={styles.profileContent}>
            <div className={styles.othersProfile}>
              <h1 className="text-4xl font-bold text-primary-content">{user.username}</h1>
              <div className={styles.labelWrapper}>
                <span className="text-2xl text-primary-content font-semibold">Email contact:</span>
                {user.email ? (
                  <a
                    className={`text-lg mx-3 underline text-blue-400 hover:text-blue-500`}
                    href={`mailto:${user.email}`}
                  >
                    {user.email}
                  </a>
                ) : (
                  <span className="text-lg mx-3 text-secondary-content">No email address provided.</span>
                )}
              </div>
              <div className={styles.labelWrapper}>
                <span className="text-2xl text-primary-content font-semibold">Biography:</span>
                <p className="text-secondary-content mt-2 mx-3">{user.biography || "No biography available."}</p>
              </div>
              <div className={styles.socialNetworksContainer}>
                {hasSocialNetworks && (
                  <div>
                    <h3 className="text-lg font-semibold text-primary-content">Social Networks</h3>
                    <div className={styles.socialNetworksIcons + " space-x-4"}>
                      {user.xUrl && <XIcon href={user.xUrl} />}
                      {user.instagramUrl && <InstagramIcon href={user.instagramUrl} />}
                      {user.linkedinUrl && <LinkedInIcon href={user.linkedinUrl} />}
                      {user.sketchfabUrl && <SketchfabIcon href={user.sketchfabUrl} />}
                      {user.artstationUrl && <ArtStationIcon href={user.artstationUrl} label={user.artstationUrl} />}
                      {user.customUrl && (
                        <a href={user.customUrl} title={user.customUrl}>
                          <LinkIcon width={24} height={24} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {!isRatingEmpty && (
          <div className="mt-6 text-right">
            <div className="mx-3">
              <RatingDisplay ratingData={ratingData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
