import Skeleton from "../Skeleton/Skeleton";
import { AvatarImageProps } from "./types";
import { blo } from "blo";

export default function AvatarImage({
  src,
  alt = "Avatar",
  width = 128,
  height = 128,
  loading = false,
  address,
}: AvatarImageProps) {
  const component = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ? src : address ? blo(address) : undefined}
      alt={address ? `${address} avatar` : alt}
      className={`rounded-full`}
      width={width}
      height={height}
    />
  );

  return (
    <div style={{ width, height }}>
      {loading ? (
        <Skeleton variant="circular" className="rounded-full" animation="pulse">
          {component}
        </Skeleton>
      ) : (
        component
      )}
    </div>
  );
}
