"use client";

import { useEffect, useState } from "react";
import { SwitchThemeProps } from "./types";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export const SwitchTheme = ({ open }: SwitchThemeProps) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const isDarkMode = resolvedTheme === "dark";

  const handleToggle = () => {
    if (isDarkMode) {
      setTheme("light");
      return;
    }
    setTheme("dark");
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <button
      onClick={handleToggle} // Call toggleTheme on click
      aria-label={`Switch to ${isDarkMode ? "dark" : "light"} mode`} // Accessibility label
      className={`
        relative flex items-center justify-center rounded-full
        bg-secondary hover:bg-[var(--color-border)]
        border-2 border-[var(--color-border)]
        shadow-md transition-all duration-500 ease-in-out
        p-2 text-primary-content mr-[20px] cursor-pointer`}
    >
      {/* Icon that changes based on the theme */}
      {isDarkMode ? (
        <MoonIcon className="transition-transform duration-300 transform rotate-0 group-hover:-rotate-12 w-6 h-6" />
      ) : (
        <SunIcon className="transition-transform duration-300 transform rotate-0 group-hover:rotate-12 w-6 h-6" />
      )}
      {
        <span
          className="whitespace-nowrap overflow-hidden text-ellipsis"
          style={{
            opacity: open ? 1 : 0,
            maxWidth: open ? 100 : 0,
            transition: "all 0.5s ease-in-out",
            margin: open ? "" : "0",
            fontSize: 14,
            marginLeft: open ? "0.5rem" : "0",
            fontWeight: "bold",
          }}
        >
          Toggle theme
        </span>
      }
    </button>
  );
};
