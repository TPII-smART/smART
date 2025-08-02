"use client";

import { JSX, useMemo } from "react";
import styles from "./Profile.module.css";
import { LinkIcon } from "@heroicons/react/24/outline";
import AvatarImage from "~~/components/AvatarImage/AvatarImage";
import BannerImage from "~~/components/BannerImage/BannerImage";
import ArtStationIcon from "~~/components/assets/Logos/artstation";
import InstagramIcon from "~~/components/assets/Logos/instagram";
import LinkedInIcon from "~~/components/assets/Logos/linkedin";
import SketchfabIcon from "~~/components/assets/Logos/sketchfab";
import XIcon from "~~/components/assets/Logos/x";
import { isImageUrl } from "~~/lib/utils";
import { UserProfile } from "~~/types/user-profile.type";

export interface OthersProfileProps {
  user: UserProfile;
  changeEditButton?: JSX.Element;
}

export default function OthersProfile({ user, changeEditButton }: OthersProfileProps) {
  const hasSocialNetworks = useMemo(() => {
    return (
      user.xUrl || user.instagramUrl || user.linkedinUrl || user.sketchfabUrl || user.artstationUrl || user.customUrl
    );
  }, [user]);

  const isProfileEmpty = useMemo(() => {
    return !user.username && !user.email && !user.biography && !hasSocialNetworks;
  }, [user, hasSocialNetworks]);

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
                src={
                  isImageUrl(user.profilePicture)
                    ? user.profilePicture
                    : `https://placehold.co/128x128/7c3aed/ffffff?text=${user.username.charAt(0).toUpperCase() || "U"}`
                }
                alt="Profile Picture"
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
      </div>
    </div>
  );
}
