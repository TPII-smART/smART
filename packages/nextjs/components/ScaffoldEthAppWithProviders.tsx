"use client";

import { useEffect, useState } from "react";
import { Header } from "./Header";
import Sidebar from "./Sidebar/Sidebar";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider, useAccount } from "wagmi";
import {
  BugAntIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  NewspaperIcon,
  TableCellsIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { SpinnerProvider } from "~~/context/SpinnerProvider";
import { UserProvider } from "~~/context/UserProvider";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();
  const { address } = useAccount();

  return (
    <>
      <main className="flex flex-1 w-full inherit">
        <Header />
        <Sidebar
          items={[
            {
              label: "Home",
              href: "/",
              icon: HomeIcon,
            },
            {
              label: "Profile",
              href: `/profile/${address}`,
              icon: UserIcon,
            },
            {
              label: "Dashboard",
              href: "/dashboard",
              icon: TableCellsIcon,
            },
            {
              label: "Browse",
              href: "/browse",
              icon: MagnifyingGlassIcon,
            },
            {
              label: "Debug Contracts",
              href: "/debug",
              icon: BugAntIcon,
            },
            {
              label: "Feed",
              href: "/feed",
              icon: NewspaperIcon,
            },
          ]}
        />
        <div className="flex flex-col w-full inherit">
          <div className="h-[7vh] w-full relative"></div>
          {children}
        </div>
      </main>
    </>
  );
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>
          <ProgressBar height="3px" color="#2299dd" />
          <RainbowKitProvider
            avatar={BlockieAvatar}
            theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme()}
          >
            <ScaffoldEthApp>
              <SpinnerProvider>{children}</SpinnerProvider>
              <Toaster /> {/* Toaster for notifications */}
            </ScaffoldEthApp>
          </RainbowKitProvider>
        </UserProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
