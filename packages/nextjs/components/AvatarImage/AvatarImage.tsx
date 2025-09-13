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
  onClickProfileNavigation = false,
}: AvatarImageProps) {
  const handleAvatarClick = (address: string) => {
    window.location.href = `/profile/${address}`;
  };

  const component = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src ? src : address ? blo(address) : undefined}
      alt={address ? `${address} avatar` : alt}
      className={`rounded-full border-2 border-border ${
        onClickProfileNavigation && address
          ? "cursor-pointer hover:opacity-80 hover:scale-105 transition-all duration-200 hover:shadow-lg"
          : ""
      }`}
      width={width}
      height={height}
      onClick={onClickProfileNavigation && address ? () => handleAvatarClick(address) : undefined}
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
