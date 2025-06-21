import React from "react";

export interface ButtonProps {
  variant: "primary" | "outline" | "danger";
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string; // Optional for additional styling via className
  style?: React.CSSProperties; // Optional for inline styles
}

const Button: React.FC<ButtonProps> = ({ variant, children, onClick, className, style }) => {
  const getStyle = (variant: string): React.CSSProperties => {
    switch (variant) {
      case "outline":
        return {
          backgroundColor: "transparent",
          color: "var(--color-accent)",
          border: "2px solid var(--color-accent)",
          borderRadius: "0.5rem",
          padding: "1rem 2rem",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer",
          width: "fit-content",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          boxSizing: "border-box",
          lineHeight: "1",
        };
      case "danger":
        return {
          backgroundColor: "var(--color-error)", // A strong red
          color: "#FFFFFF", // White text
          border: "2px solid var(--color-error)",
          borderRadius: "0.5rem",
          padding: "1rem 2rem",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer",
          width: "fit-content",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          boxSizing: "border-box",
          lineHeight: "1",
        };
      default:
        // Primary button as default
        return {
          backgroundColor: "var(--color-accent)", // A shade of orange
          color: "var(--color-primary-content)", // Dark gray for text
          border: "2px solid var(--color-accent)",
          borderRadius: "0.5rem",
          padding: "1rem 2rem",
          fontSize: "18px",
          fontWeight: "bold",
          cursor: "pointer",
          width: "fit-content",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          boxSizing: "border-box",
          lineHeight: "1",
        };
    }
  };

  const _style = getStyle(variant);

  return (
    <button style={{ ..._style, ...style }} onClick={onClick} className={className}>
      {children}
    </button>
  );
};

export default Button;
