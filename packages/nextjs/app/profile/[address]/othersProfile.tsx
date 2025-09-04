"use client";

import { useMemo } from "react";
import styles from "./Profile.module.css";
import Button from "@/components/Button/Button";
import { LinkIcon } from "@heroicons/react/24/solid";
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
  ratingData: RatingData;
  onEditClick?: () => void;
}

export default function OthersProfile({ user, address, ratingData, onEditClick }: OthersProfileProps) {
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
        {isProfileEmpty ? (
          <div className={styles.profileHeader}>
            <div className={styles.bannerSection}>
              {isImageUrl(user.bannerPicture) ? (
                <BannerImage src={user.bannerPicture} alt="Banner" height={400} width="100%" />
              ) : (
                <div className={styles.placeholderBanner} />
              )}
              <div className={styles.bannerOverlay} />

              {/* Rating in top right */}
              {!isRatingEmpty && (
                <div className="absolute top-6 right-6 z-10">
                  <div className="ratingDisplayOverlay">
                    <RatingDisplay ratingData={ratingData} tooltipPosition="left" />
                  </div>
                </div>
              )}

              {/* Edit Button in bottom right */}
              {onEditClick && (
                <div className={styles.profileEditButton}>
                  <Button onClick={onEditClick} variant="outline" size="sm" color="accent">
                    Edit Profile
                  </Button>
                </div>
              )}

              <div className={styles.profileInfo}>
                <div className={styles.profileLeft}>
                  <div className={styles.avatarWrapper}>
                    <AvatarImage
                      src={isImageUrl(user.profilePicture) ? user.profilePicture : undefined}
                      alt="Profile Picture"
                      address={address as `0x${string}`}
                    />
                  </div>
                  <div className={styles.profileDetails}>
                    <h1 className={styles.emptyProfileText}>
                      {"This profile is empty" + (onEditClick ? ", click the button to edit it!" : "!")}
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={styles.profileHeader}>
            <div className={styles.bannerSection}>
              {isImageUrl(user.bannerPicture) ? (
                <BannerImage src={user.bannerPicture} alt="Banner" height={400} width="100%" />
              ) : (
                <div className={styles.placeholderBanner} />
              )}
              <div className={styles.bannerOverlay} />

              {/* Social Networks in Header */}
              {hasSocialNetworks && (
                <div className={styles.socialNetworksInHeader}>
                  {user.xUrl && (
                    <a href={user.xUrl} className="hover:opacity-70 transition-opacity text-white">
                      <XIcon width={25} height={25} color="white" />
                    </a>
                  )}
                  {user.instagramUrl && (
                    <a href={user.instagramUrl} className="hover:opacity-70 transition-opacity text-white">
                      <InstagramIcon width={25} height={25} color="white" />
                    </a>
                  )}
                  {user.linkedinUrl && (
                    <a href={user.linkedinUrl} className="hover:opacity-70 transition-opacity text-white">
                      <LinkedInIcon width={25} height={25} color="white" />
                    </a>
                  )}
                  {user.sketchfabUrl && (
                    <a href={user.sketchfabUrl} className="hover:opacity-70 transition-opacity text-white">
                      <SketchfabIcon width={25} height={25} color="white" />
                    </a>
                  )}
                  {user.artstationUrl && (
                    <a href={user.artstationUrl} className="hover:opacity-70 transition-opacity text-white">
                      <ArtStationIcon width={25} height={25} color="white" />
                    </a>
                  )}
                  {user.customUrl && (
                    <a href={user.customUrl} title={user.customUrl} className="hover:opacity-70 transition-opacity">
                      <LinkIcon width={25} height={25} />
                    </a>
                  )}
                </div>
              )}

              {/* Rating in top right */}
              {!isRatingEmpty && (
                <div className="absolute top-6 right-6 z-10">
                  <div className="ratingDisplayOverlay">
                    <RatingDisplay ratingData={ratingData} tooltipPosition="left" />
                  </div>
                </div>
              )}

              {/* Edit Button in bottom right */}
              {onEditClick && (
                <div className={styles.profileEditButton}>
                  <Button onClick={onEditClick} variant="outline" size="sm" color="accent">
                    Edit Profile
                  </Button>
                </div>
              )}

              <div className={styles.profileInfo}>
                <div className={styles.profileLeft}>
                  <div className={styles.avatarWrapper}>
                    <AvatarImage
                      src={isImageUrl(user.profilePicture) ? user.profilePicture : undefined}
                      alt="Profile Picture"
                      address={address as `0x${string}`}
                    />
                  </div>

                  <div className={styles.profileDetails}>
                    <h1 className={styles.profileName}>{user.username || "Anonymous User"}</h1>
                    {user.email && (
                      <a className={styles.profileEmail + " hover:underline"} href={`mailto:${user.email}`}>
                        {user.email}
                      </a>
                    )}
                    {user.biography && <p className={styles.profileBio}>{user.biography}</p>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
