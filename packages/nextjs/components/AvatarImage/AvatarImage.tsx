import Skeleton from "../Skeleton/Skeleton";
import { AvatarImageProps } from "./types";

export default function AvatarImage({
  src,
  alt = "Avatar",
  width = 128,
  height = 128,
  loading = false,
}: AvatarImageProps) {
  const component = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ? src : undefined}
      alt={alt}
      className={`rounded-full border-2 border-border`}
      width={width}
      height={height}
    />
  );

  return (
    <div style={{ width, height }}>
      {loading ? (
        <Skeleton variant="circular" className="rounded-full border-2 border-border" animation="pulse">
          {component}
        </Skeleton>
      ) : (
        component
      )}
    </div>
  );
}
