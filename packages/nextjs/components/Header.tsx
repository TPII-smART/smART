"use client";

import React, { useRef } from "react";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

export const Header = () => {
  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  return (
    <div
      className="fixed top-0 left-0 w-full flex flex-row items-center justify-end space-x-3"
      style={{
        height: "7vh",
        paddingLeft: 10,
        paddingRight: 10,
        zIndex: 999,
        backgroundColor: "inherit",
        color: "var(--color-primary-content)",
      }}
    >
      <RainbowKitCustomConnectButton />
    </div>
  );
};
