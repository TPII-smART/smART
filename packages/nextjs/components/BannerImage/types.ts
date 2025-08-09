export interface BannerImageProps {
  /**
   * The source URL of the banner image.
   */
  src?: string;
  /**
   * The alternative text for the banner image.
   */
  alt?: string;
  /**
   * The width of the banner image.
   */
  width?: string | number;
  /**
   * The height of the banner image.
   */
  height?: string | number;
  /**
   * Whether the image should be displayed with a loading state.
   */
  loading?: boolean;
}
