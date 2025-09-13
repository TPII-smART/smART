export interface AvatarImageProps {
  /**
   * The source URL of the avatar image.
   */
  src?: string;
  /**
   * The alternative text for the avatar image.
   */
  alt?: string;
  /**
   * The width of the avatar image.
   */
  width?: string | number;
  /**
   * The height of the avatar image.
   */
  height?: string | number;
  /**
   * Whether the image should be displayed with a loading state.
   */
  loading?: boolean;
  /**
   * Optional address for the avatar, if applicable.
   */
  address?: `0x${string}`; // Optional address for the avatar, if applicable
  /**
   * Whether clicking the avatar should navigate to the avatar's owner profile.
   */
  onClickProfileNavigation?: boolean;
}
