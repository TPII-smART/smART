import { SVGIconProps } from "./types";

const XIcon = ({ width = 24, height = 24, onClick, label = "X", href }: SVGIconProps) => {
  const iconBase = (
    <svg
      role="img"
      viewBox="0 0 24 24"
      style={{ width, height, ...((onClick || href) && { cursor: "pointer" }) }}
      onClick={onClick}
    >
      <title>{href ?? label}</title>
      <path
        d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"
        fill="var(--color-primary-content)"
      />
    </svg>
  );

  return href ? <a href={href}>{iconBase}</a> : iconBase;
};

export default XIcon;
