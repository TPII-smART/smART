"use client";

import { ChangeEvent, Dispatch, SetStateAction, useState } from "react";
import styles from "./Profile.module.css";
import { resolveIPFSHash, uploadToIPFS } from "@services/IPFS/pinataIPFS";
import { LinkIcon, PencilIcon } from "@heroicons/react/24/outline";
import AvatarImage from "~~/components/AvatarImage/AvatarImage";
import BannerImage from "~~/components/BannerImage/BannerImage";
import Button from "~~/components/Button/Button";
import ArtStationIcon from "~~/components/assets/Logos/artstation";
import InstagramIcon from "~~/components/assets/Logos/instagram";
import LinkedInIcon from "~~/components/assets/Logos/linkedin";
import SketchfabIcon from "~~/components/assets/Logos/sketchfab";
import XIcon from "~~/components/assets/Logos/x";
import { InputBase } from "~~/components/scaffold-eth";
import { useGlobalSpinner } from "~~/context/SpinnerProvider";
import { useUserContext } from "~~/context/UserProvider";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { addPrefixToUrl, isImageUrl } from "~~/lib/utils";
import { UserProfile } from "~~/types/user-profile.type";

const EditButton = ({ onClick, isLoading = false }: { onClick: () => void; isLoading?: boolean }) => (
  <button
    onClick={onClick}
    disabled={isLoading}
    className={`p-3 bg-black/60 hover:bg-black/80 rounded-full cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-white/20`}
  >
    {isLoading ? (
      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
    ) : (
      <PencilIcon className="h-5 w-5 text-white" />
    )}
  </button>
);

export interface OwnProfileProps {
  user: UserProfile;
  address: `0x${string}`;
  setUser: Dispatch<SetStateAction<UserProfile>>;
  onSave: () => void;
}

export default function OwnProfile({ user, setUser, onSave, address }: OwnProfileProps) {
  const [hasChanged, setHasChanged] = useState(false);

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const { reloadUser } = useUserContext();
  const { showSpinner, hideSpinner } = useGlobalSpinner();
  const { writeContractAsync: updateUserProfile } = useScaffoldWriteContract({
    contractName: "ProfileConfigContract",
  });

  const handleImageUpload = async (type: "banner" | "avatar") => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const fileUrl = URL.createObjectURL(file);
        if (type === "banner") {
          setBannerPreview(fileUrl);
        } else {
          setAvatarPreview(fileUrl);
        }

        if (type === "banner") {
          // Clear previous banner preview if exists
          if (bannerPreview) {
            URL.revokeObjectURL(bannerPreview);
          }
          setBannerPreview(fileUrl);
          setBannerFile(file);
        } else {
          if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
          }
          setAvatarPreview(fileUrl);
          setAvatarFile(file);
        }

        setHasChanged(true);
      } catch (error) {
        console.error(`${type} upload failed:`, error);
      }
    };
    input.click();
  };

  const getAvatarSrc = () => {
    if (avatarPreview) return avatarPreview;
    if (user && isImageUrl(user.profilePicture || "")) return user.profilePicture; // IPFS URL
  };

  const handleFileUpload = async (file: File | null, type: "banner" | "avatar"): Promise<string | null> => {
    if (!file) return null;

    try {
      console.log(` Uploading ${type} to IPFS...`);
      const imageUri = await uploadToIPFS(file);
      const imageHash = imageUri ? resolveIPFSHash(imageUri) : undefined;

      if (imageHash) {
        console.log(` ${type} uploaded:`, imageHash);
        return imageHash;
      }
      return null;
    } catch (error) {
      console.error(`${type} upload failed:`, error);
      if (type === "banner") {
        setBannerPreview(null);
      } else {
        setAvatarPreview(null);
      }
      return null;
    }
  };

  const cleanPreview = () => {
    if (bannerPreview) {
      URL.revokeObjectURL(bannerPreview);
      setBannerPreview(null);
    }
    setBannerFile(null);

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    setAvatarFile(null);
  };

  const handleChange = (
    value: string | ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
    key: keyof UserProfile,
  ) => {
    const newValue = typeof value === "string" ? value : value.target.value;
    setUser(prev => ({ ...prev, [key]: newValue }));
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
        const bannerHash = await handleFileUpload(bannerFile, "banner");
        const avatarHash = await handleFileUpload(avatarFile, "avatar");

        const updatedUser = { ...user };

        if (bannerHash) {
          updatedUser.bannerPicture = bannerHash;
        }
        if (avatarHash) {
          updatedUser.profilePicture = avatarHash;
        }

        socialNetworks.forEach(({ key }) => {
          if (updatedUser[key]) {
            updatedUser[key] = addPrefixToUrl(updatedUser[key], "https://");
          }
        });

        Object.keys(updatedUser).forEach(key => {
          if (typeof updatedUser[key as keyof UserProfile] === "string") {
            updatedUser[key as keyof UserProfile] = (updatedUser[key as keyof UserProfile] as string).trim();
          }
        });

        await updateUserProfile({
          functionName: "setProfile",
          args: [updatedUser],
        });

        setUser(updatedUser);

        await reloadUser(); // Reload user profile after update
      }
      cleanPreview();
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
        {/* Profile Header Section */}
        <div className={styles.profileHeader}>
          <div className={styles.bannerSection}>
            {bannerPreview ? (
              <BannerImage src={bannerPreview} alt="Banner" height={400} width="100%" />
            ) : isImageUrl(user?.bannerPicture || "") ? (
              <BannerImage src={user.bannerPicture} alt="Banner" height={400} width="100%" />
            ) : (
              <div className={styles.placeholderBanner} />
            )}
            <div className={styles.bannerOverlay} />

            <div className="absolute top-6 right-6 z-10">
              <EditButton onClick={() => handleImageUpload("banner")} />
            </div>

            <div className={styles.profileInfo}>
              <div className={styles.profileLeft}>
                <div className={styles.avatarWrapper}>
                  <AvatarImage src={getAvatarSrc()} alt="Profile Picture" address={address} />
                  <div className="absolute bottom-2 right-2">
                    <EditButton onClick={() => handleImageUpload("avatar")} />
                  </div>
                </div>

                <div className={styles.profileDetails}>
                  <h1 className={styles.profileName}>Edit Profile</h1>
                  <p className={styles.profileEmail}>Customize your public profile information</p>
                  <p className={styles.profileBio}>Make sure to save your changes!</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className={styles.profileContent}>
          <div className={styles.formSection}>
            <div className={styles.inputsContainer}>
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
              <InputBase
                multiline
                minRows={4}
                maxRows={4}
                value={user?.biography}
                onChange={v => handleChange(v, "biography")}
                placeholder="Biography"
                variant="outlined"
              />
            </div>

            <div className={styles.socialNetworksContainer}>
              <h3 className="text-xl font-semibold text-primary-content mb-4">Social Networks</h3>
              <div className="space-y-4">
                {socialNetworks.map(({ icon: Icon, placeholder, key }) => (
                  <div className={styles.socialNetworkWrapper} key={key}>
                    <Icon width={24} height={24} />
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

          <div className={styles.saveButtonContainer}>
            <Button variant="primary" onClick={handleSubmit} size="lg">
              Save Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
