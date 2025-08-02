"use client";

import { Dispatch, SetStateAction, useState } from "react";
import styles from "./Profile.module.css";
import { LinkIcon } from "@heroicons/react/24/outline";
import AvatarImage from "~~/components/AvatarImage/AvatarImage";
import BannerImage from "~~/components/BannerImage/BannerImage";
import Button from "~~/components/Button/Button";
import ArtStationIcon from "~~/components/assets/Logos/artstation";
import InstagramIcon from "~~/components/assets/Logos/instagram";
import LinkedInIcon from "~~/components/assets/Logos/linkedin";
import SketchfabIcon from "~~/components/assets/Logos/sketchfab";
import XIcon from "~~/components/assets/Logos/x";
import { InputBase } from "~~/components/scaffold-eth";
import { TextArea } from "~~/components/scaffold-eth/Input/TextArea";
import { useGlobalSpinner } from "~~/context/SpinnerProvider";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { addPrefixToUrl, isImageUrl } from "~~/lib/utils";
import { UserProfile } from "~~/types/user-profile.type";

const EditButton = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
  </svg>
);

export interface OwnProfileProps {
  user: UserProfile;
  setUser: Dispatch<SetStateAction<UserProfile>>;
  onSave: () => void;
}

export default function OwnProfile({ user, setUser, onSave }: OwnProfileProps) {
  const [hasChanged, setHasChanged] = useState(false);
  const { showSpinner, hideSpinner } = useGlobalSpinner();
  const { writeContractAsync: updateUserProfile } = useScaffoldWriteContract({
    contractName: "ProfileConfigContract",
  });

  const handleChange = (value: string, key: keyof UserProfile) => {
    setUser(prev => ({ ...prev, [key]: value.trim() }));
    setHasChanged(true);
  };

  const socialNetworks = [
    {
      icon: XIcon,
      placeholder: "Twitter / X",
      key: "xUrl",
    },
    {
      icon: InstagramIcon,
      placeholder: "Instagram",
      key: "instagramUrl",
    },
    {
      icon: LinkedInIcon,
      placeholder: "LinkedIn",
      key: "linkedinUrl",
    },
    {
      icon: ArtStationIcon,
      placeholder: "ArtStation",
      key: "artstationUrl",
    },
    {
      icon: SketchfabIcon,
      placeholder: "Sketchfab",
      key: "sketchfabUrl",
    },
    {
      icon: LinkIcon,
      placeholder: "Website",
      key: "customUrl",
    },
  ] as { icon: typeof XIcon | typeof LinkIcon; placeholder: string; key: keyof UserProfile }[];

  const handleSubmit = async () => {
    showSpinner();

    try {
      // If user does not change any field, we do not update the profile
      // This is to avoid unnecessary transactions (and gas costs)
      if (hasChanged) {
        socialNetworks.forEach(({ key }) => {
          if (user[key]) {
            setUser(prev => ({ ...prev, [key]: addPrefixToUrl(user[key], "https://") }));
          }
        });

        await updateUserProfile({
          functionName: "setProfile",
          args: [user],
        });
      }

      onSave();
    } catch (err) {
      console.error("Failed to update the profile:", err);
    } finally {
      hideSpinner();
    }
  };

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
          <div className="absolute top-0 right-0 m-4 bg-gray-800/50 p-2 rounded-full cursor-pointer hover:bg-gray-700/70">
            <EditButton />
          </div>
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
              <div className="absolute bottom-2 right-2 bg-gray-800/50 p-2 rounded-full cursor-pointer hover:bg-gray-700/70">
                <EditButton />
              </div>
            </div>
          </div>
        </div>
        <div className={styles.editButton} />
        <div className={styles.profileContent}>
          <div className={styles.ownProfile}>
            <h1 className="text-3xl font-bold text-primary-content">Edit Profile</h1>
            <div className={styles.inputsContainer + " space-y-12"}>
              <InputBase
                variant="outlined"
                placeholder="Username"
                value={user?.username}
                onChange={v => handleChange(v, "username")}
              />
              <InputBase
                variant="outlined"
                placeholder="Email Address"
                value={user?.email}
                onChange={v => handleChange(v, "email")}
              />
              <TextArea
                rows={4}
                value={user?.biography}
                onChange={v => handleChange(v, "biography")}
                placeholder="Biography"
                variant="outlined"
              />

              <div>
                <h3 className="text-lg font-semibold text-primary-content">Social Networks</h3>
                <div className={styles.socialNetworksContainer}>
                  {socialNetworks.map(({ icon: Icon, placeholder, key }) => (
                    <div className={styles.socialNetworkWrapper} key={key}>
                      <Icon width={30} height={30} />
                      <InputBase
                        placeholder={placeholder}
                        value={user[key] ? user[key] : ""}
                        onChange={v => handleChange(v, key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 py-6 border-t border-gray-700 flex justify-end min-w-full">
          <Button variant="primary" onClick={handleSubmit}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
