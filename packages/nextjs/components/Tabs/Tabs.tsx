import React from "react";
import { TabsProps } from "./types";
import { Box, Tab as MUITab, Tabs as MUITabs } from "@mui/material";

const Tabs: React.FC<TabsProps> = ({
  tabs,
  color = "var(--color-accent)",
  onChange,
  variant = "fullWidth",
  centered = true,
}) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "var(--color-border)" }}>
      <MUITabs
        value={value}
        onChange={handleChange}
        aria-label="basic tabs example"
        variant={variant}
        centered={variant === "scrollable" ? false : centered}
        scrollButtons={variant === "scrollable" ? "auto" : false}
        sx={{
          "& .MuiTabs-indicator": {
            backgroundColor: color,
          },
        }}
      >
        {tabs.map((tab, index) => (
          <MUITab
            key={tab.id}
            label={tab.label}
            disabled={tab.disabled}
            icon={tab.icon}
            iconPosition={tab.iconPosition}
            // Execute handler only in non already selected tabs
            onClick={index === value ? undefined : () => onChange(tab.id, tab.label)}
            sx={{
              color: "var(--color-primary-content)",
              "&.Mui-disabled": {
                color: "var(--color-skeleton)",
              },
              "&.Mui-selected": {
                color,
              },
            }}
          />
        ))}
      </MUITabs>
    </Box>
  );
};

export default Tabs;
