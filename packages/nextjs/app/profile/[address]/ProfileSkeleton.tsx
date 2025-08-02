import styles from "./Profile.module.css";
import AvatarImage from "~~/components/AvatarImage/AvatarImage";
import BannerImage from "~~/components/BannerImage/BannerImage";
import Skeleton from "~~/components/Skeleton/Skeleton";

const ProfileSkeleton = () => (
  <div className={styles.profileTab}>
    <div className={styles.profileContainer}>
      <div className="relative">
        <BannerImage height={192} width={"100%"} loading={true} />
        <div className={styles.avatarImage}>
          <div className="relative">
            <AvatarImage loading={true} />
          </div>
        </div>
      </div>
      <div className={styles.editButton} />
      <div className={styles.profileContent}>
        <div className={styles.othersProfile}>
          <Skeleton variant="rectangular" width={"35%"} height={40} />
          <div className={styles.labelWrapper}>
            <Skeleton variant="text" width={"30%"} height={40} />
            <Skeleton variant="text" width={"40%"} height={30} />
          </div>
          <div className={styles.labelWrapper}>
            <Skeleton variant="text" width={"30%"} height={40} />
            <Skeleton variant="rectangular" width={"90%"} height={180} />
          </div>
          <div className={styles.socialNetworksContainer}>
            <div>
              <Skeleton variant="text" width={"30%"} />
              <Skeleton variant="rectangular" width={"40%"} height={50} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ProfileSkeleton;
