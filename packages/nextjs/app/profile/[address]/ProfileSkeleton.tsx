import styles from "./Profile.module.css";
import BannerImage from "~~/components/BannerImage/BannerImage";
import Skeleton from "~~/components/Skeleton/Skeleton";

const ProfileSkeleton = () => (
  <div className={styles.profileTab}>
    <div className={styles.profileContainer}>
      {/* Profile Header Section */}
      <div className={styles.profileHeader}>
        <div className={styles.bannerSection}>
          <BannerImage height={400} width="100%" loading={true} />
          <div className={styles.bannerOverlay} />

          {/* Social Networks Skeleton in Header */}
          <div className={styles.socialNetworksInHeader}>
            <Skeleton variant="rectangular" width={25} height={25} animation="pulse" />
            <Skeleton variant="rectangular" width={25} height={25} animation="pulse" />
            <Skeleton variant="rectangular" width={25} height={25} animation="pulse" />
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.profileLeft}>
              <div className={styles.avatarWrapper}>
                <Skeleton variant="circular" width={100} height={100} className="rounded-full" animation="pulse" />
              </div>

              <div className={styles.profileDetails}>
                <Skeleton variant="text" width={200} height={40} />
                <Skeleton variant="text" width={150} height={24} />
                <Skeleton variant="text" width={300} height={20} />
              </div>
            </div>

            <div className={styles.profileActions}>
              <Skeleton variant="rectangular" width={100} height={40} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default ProfileSkeleton;
