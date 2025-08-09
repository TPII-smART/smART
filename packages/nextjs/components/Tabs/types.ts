import React from "react";

export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactElement;
  iconPosition?: "bottom" | "top" | "start" | "end";
}

export interface TabsProps {
  tabs: Tab[];
  onChange: (id: string, label?: string) => void;
  color?: string;
}
