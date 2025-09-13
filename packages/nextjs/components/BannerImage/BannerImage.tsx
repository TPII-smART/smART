import Skeleton from "../Skeleton/Skeleton";
import { BannerImageProps } from "./types";

export default function BannerImage({
  src,
  alt = "Banner",
  width = 128,
  height = 128,
  loading = false,
}: BannerImageProps) {
  const component = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ? src : undefined}
      className={`object-cover`}
      alt={alt}
      width={width}
      height={height}
      style={{ maxHeight: height }}
    />
  );

  return loading ? <Skeleton variant="rectangular" width={width} height={height} /> : component;
}
