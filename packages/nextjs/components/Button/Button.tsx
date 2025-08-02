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
  tooltip,
  size = "md",
  disabled = false,
}) => {
  const getSizeStyles = (size: string): React.CSSProperties => {
    switch (size) {
      case "sm":
        return {
          padding: "0.5rem 1rem",
          fontSize: "14px",
          borderRadius: "0.375rem",
        };
      case "lg":
        return {
          padding: "1.25rem 2.5rem",
          fontSize: "20px",
          borderRadius: "0.625rem",
        };
      case "md":
      default:
        return {
          padding: "1rem 2rem",
          fontSize: "18px",
          borderRadius: "0.5rem",
        };
    }
  };

  const getSpinnerSize = (size: string): number => {
    switch (size) {
      case "sm":
        return 20;
      case "lg":
        return 36;
      case "md":
      default:
        return 30;
    }
  };

  const getStyle = (variant: string): React.CSSProperties => {
    const sizeStyles = getSizeStyles(size);

    const shared: React.CSSProperties = {
      fontWeight: "bold",
      cursor: disabled ? "not-allowed" : "pointer",
      width: "fit-content",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      textAlign: "center",
      boxSizing: "border-box",
      lineHeight: "1",
      opacity: disabled ? 0.5 : 1,
      transition: "all 0.2s ease-in-out",
      ...sizeStyles,
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
          backgroundColor: "var(--color-error)",
          color: "#FFFFFF",
          border: "2px solid var(--color-error)",
          ...shared,
        };
      default:
        // Primary button as default
        return {
          backgroundColor: "var(--color-accent)",
          color: "var(--color-secondary-content)",
          border: "2px solid var(--color-accent)",
          ...shared,
        };
    }
  };

  const _style = getStyle(variant);
  const spinnerSize = getSpinnerSize(size);

  return (
    <button
      title={tooltip}
      style={{ ..._style, ...style }}
      onClick={onClick}
      className={className}
      disabled={disabled || loading}
    >
      {loading && <Spinner numberOfArcs={1} size={spinnerSize} sizeMultiplier={1} color={"var(--color-primary)"} />}
      <div
        style={{
          opacity: loading ? 0 : 1,
          width: loading ? 0 : "",
          display: "inline-flex",
          gap: size === "sm" ? "6px" : "8px",
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
