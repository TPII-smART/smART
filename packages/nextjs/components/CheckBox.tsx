import React from "react";
import CheckIcon from "./assets/Checkbox/CheckedIcon";
import UncheckIcon from "./assets/Checkbox/UncheckedIcon";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  className?: string;
  checkStyle?: React.CSSProperties;
  containerStyle?: React.CSSProperties;
}

const hiddenCheckboxStyle: React.CSSProperties = {
  // Hide checkbox visually but remain accessible to screen readers
  border: 0,
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: "1px",
  margin: "-1px",
  overflow: "hidden",
  padding: 0,
  position: "absolute",
  whiteSpace: "nowrap",
  width: "1px",
};

const checkboxContainerStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  cursor: "pointer",
};

const customCheckboxStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background-color 0.2s, border-color 0.2s",
  boxSizing: "border-box",
  width: "2rem",
  height: "2rem",
};

const Checkbox: React.FC<CheckboxProps> = ({ checked, onChange, label, className, checkStyle, containerStyle }) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.checked);
  };

  const contStyle = { ...checkboxContainerStyle, ...containerStyle };
  const svgStyle = { ...customCheckboxStyle, ...checkStyle };

  return (
    <label style={contStyle} className={className}>
      <input type="checkbox" checked={checked} onChange={handleChange} style={hiddenCheckboxStyle} />
      <div style={svgStyle}>{checked ? <CheckIcon /> : <UncheckIcon />}</div>
      {label && <span style={{ marginLeft: "0.5rem", color: "var(--color-primary-content)" }}>{label}</span>}
    </label>
  );
};

export default Checkbox;
