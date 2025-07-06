import React from "react";
import Spinner from "../Spinner/Spinner";
import { ButtonProps } from "./types";

const Button: React.FC<ButtonProps> = ({
  variant,
  children,
  onClick,
  className,
  style,
  loading,
  icon,
  disabled = false,
}) => {
  const getStyle = (variant: string): React.CSSProperties => {
    const shared: React.CSSProperties = {
      borderRadius: "0.5rem",
      padding: "1rem 2rem",
      fontSize: "18px",
      fontWeight: "bold",
      cursor: "pointer",
      width: "fit-content",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      boxSizing: "border-box",
      lineHeight: "1",
      opacity: disabled ? 0.5 : 1,
    };

    switch (variant) {
      case "outline":
        return {
          backgroundColor: "transparent",
          color: "var(--color-accent)",
          border: "2px solid var(--color-accent)",
          ...shared,
        };
      case "danger":
        return {
          backgroundColor: "var(--color-error)", // A strong red
          color: "#FFFFFF", // White text
          border: "2px solid var(--color-error)",
          ...shared,
        };
      default:
        // Primary button as default
        return {
          backgroundColor: "var(--color-accent)", // A shade of orange
          color: "var(--color-primary-content)", // Dark gray for text
          border: "2px solid var(--color-accent)",
          ...shared,
        };
    }
  };

  const _style = getStyle(variant);

  return (
    <button style={{ ..._style, ...style }} onClick={onClick} className={className}>
      {loading && <Spinner numberOfArcs={1} size={30} sizeMultiplier={1} color={"var(--color-primary)"} />}
      <div
        style={{
          opacity: loading ? 0 : 1,
          width: loading ? 0 : "",
          display: "inline-flex",
          gap: "8px",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
        {children}
      </div>
    </button>
  );
};

export default Button;
