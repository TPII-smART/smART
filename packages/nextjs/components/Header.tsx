"use client";

import React, { useRef } from "react";
import { RedirectType, redirect } from "next/navigation";
import { BellIcon } from "@heroicons/react/24/outline";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";
import { useGlobalNotifications } from "~~/context/NotificationsCountProvider";
import { useOutsideClick } from "~~/hooks/scaffold-eth";

export const Header = () => {
  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  const { unreadCount: unreadNotifications } = useGlobalNotifications();

  return (
    <>
      <div
        className="fixed top-0 left-0 w-full flex flex-row items-center justify-end space-x-3"
        style={{
          minHeight: 50,
          height: "7vh",
          paddingLeft: 10,
          paddingRight: 10,
          zIndex: 999,
          backgroundColor: "inherit",
          color: "var(--color-primary-content)",
        }}
      >
        <RainbowKitCustomConnectButton />
        <div
          className="h-8 w-8 hover:bg-secondary rounded-2xl flex items-center justify-center cursor-pointer"
          onClick={() => redirect("/notifications", RedirectType.push)}
        >
          {unreadNotifications !== 0 && (
            <div className="h-4 w-4 bg-red-600 rounded-4xl text-primary-content text-xs align-middle text-center font-bold absolute mb-5 ml-4">
              {unreadNotifications}
            </div>
          )}
          <BellIcon className="h-6 w-6" />
        </div>
      </div>
    </>
  );
};
