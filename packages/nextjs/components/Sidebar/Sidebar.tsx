"use client";

import React from "react";
import { SwitchTheme } from "../SwitchTheme/SwitchTheme";
import { SidebarElementProps, SidebarProps } from "./types";
import { styled } from "@mui/material";
import Box from "@mui/material/Box";
import { Bars3Icon } from "@heroicons/react/24/outline";

const MAX_WIDTH = 240; // Maximum width of the sidebar when open
const MIN_WIDTH = 80; // Minimum width of the sidebar when closed

const SidebarContainer = styled(Box, {
  shouldForwardProp: prop => prop !== "open",
})<{ open: boolean }>(({ open }) => ({
  width: open ? MAX_WIDTH : MIN_WIDTH,
  maxWidth: open ? MAX_WIDTH : MIN_WIDTH,
  minWidth: open ? MAX_WIDTH : MIN_WIDTH,
  height: "100vh",
  backgroundColor: "inherit",
  color: "var(--color-primary-content)",
  display: "flex",
  flexDirection: "column",
  padding: 2,
  transition: "all 0.5s ease-in-out",
}));

const SidebarContent = styled(Box, {
  shouldForwardProp: prop => prop !== "open",
})<{ open: boolean }>(({ open }) => ({
  width: open ? MAX_WIDTH : MIN_WIDTH,
  maxWidth: open ? MAX_WIDTH : MIN_WIDTH,
  minWidth: open ? MAX_WIDTH : MIN_WIDTH,
  position: "fixed",
  height: "100vh",
  display: "grid",
  gridTemplateRows: "auto 1fr auto",
  gap: 2,
  backgroundColor: "inherit",
  color: "var(--color-primary-content)",
  padding: 20,
  top: 0,
  left: 0,
  transition: "all 0.5s ease-in-out",
  overflow: "hidden",
  zIndex: 1000,
}));

const Header = styled(Box)({
  display: "flex",
  flexDirection: "row",
  gap: 1,
  objectFit: "contain",
  maxWidth: MAX_WIDTH,
  paddingRight: 20,
});

const Content = styled(Box)({
  display: "flex",
  flexDirection: "column",
  gap: 1,
  objectFit: "contain",
  marginTop: 30,
  paddingRight: 20,
});

const SmartLogo = () => {
  return (
    <svg width="100" height="24" viewBox="0 0 600 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="-110" y="160" fontFamily="Arial, sans-serif" fontSize="200" fontWeight="bold">
        <tspan fill="#007BFF">sm</tspan>
        <tspan fill="#FF4500">ART</tspan>
      </text>
    </svg>
  );
};

const SidebarItem = (props: SidebarElementProps) => {
  return (
    <div
      style={{
        width: "100%",
        pointerEvents: props.disabled ? "none" : "auto",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        maxWidth: props.open ? MAX_WIDTH - 2 * 20 : MIN_WIDTH - 2 * 20,
        minWidth: props.open ? MAX_WIDTH - 2 * 20 : MIN_WIDTH - 2 * 20,
        padding: 8,
        borderRadius: 8,
        backgroundColor: "transparent",
        cursor: "pointer",
        transition: "all 0.5s ease-in-out",
        border: "none",
        outline: "none",
        boxSizing: "border-box",
        userSelect: "none",
      }}
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = "var(--color-secondary)")}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
      onClick={props.onClick ? props.onClick : () => (window.location.href = props.href || "#")}
    >
      {props.icon && <props.icon className="min-h-6 max-h-6 min-w-6 max-w-6 text-primary-content" />}

      <span
        className="whitespace-nowrap overflow-hidden text-ellipsis"
        style={{
          opacity: props.open ? 1 : 0,
          transition: "all 0.5s ease-in-out",
          textAlign: "left",
        }}
      >
        {props.label ? props.label : props.customLabel ? props.customLabel : null}
      </span>
    </div>
  );
};

const Sidebar = (props: SidebarProps) => {
  const [open, setOpen] = React.useState(true);

  return (
    <SidebarContainer open={open}>
      <SidebarContent open={open}>
        <Header>
          <SidebarItem customLabel={SmartLogo()} icon={Bars3Icon} open={open} onClick={() => setOpen(!open)} />
        </Header>

        <Content>
          {props.items?.map((item, index) => (
            <SidebarItem
              key={index}
              label={item.label}
              icon={item.icon}
              href={item.href}
              open={open}
              disabled={item.disabled}
            />
          ))}
        </Content>

        <SwitchTheme open={open} />
      </SidebarContent>
    </SidebarContainer>
  );
};

export default Sidebar;
