import React from "react";

export interface Tab {
  /**
   * Unique identifier for the tab
   */
  id: string;
  /**
   * Label for the tab
   */
  label: string;
}

export interface TabProps extends Tab {
  /**
   * Whether the tab is disabled
   */
  disabled?: boolean;
  /**
   * Icon for the tab
   */
  icon?: React.ReactElement;
  /**
   * Position of the icon
   */
  iconPosition?: "bottom" | "top" | "start" | "end";
}

export interface TabsProps {
  /**
   * Array of tabs
   */
  tabs: TabProps[];
  /**
   * Callback function called when the tab is changed
   */
  onChange: (id: string, label?: string) => void;
  /**
   * Color of the selected tab
   */
  color?: string;
  /**
   * Variant of the tabs
   */
  variant?: "scrollable" | "fullWidth" | "standard";
  /**
   * Whether the tabs should be centered, take in mind it can't be used with 'scrollable' variant
   */
  centered?: boolean;
}
