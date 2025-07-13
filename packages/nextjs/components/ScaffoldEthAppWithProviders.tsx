"use client";

import { useEffect, useState } from "react";
import { Header } from "./Header";
import Sidebar from "./Sidebar/Sidebar";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import {
  BriefcaseIcon,
  BugAntIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();

  return (
    <>
      <main className="flex flex-1 w-full">
        <Header />
        <Sidebar
          items={[
            {
              label: "Home",
              href: "/",
              icon: HomeIcon,
            },
            {
              label: "My Jobs",
              href: "/my-jobs",
              icon: BriefcaseIcon,
            },
            {
              label: "My hires",
              href: "/hires",
              icon: WrenchScrewdriverIcon,
            },
            {
              label: "Ponder",
              href: "/ponder-greetings",
              icon: MagnifyingGlassIcon,
            },
            {
              label: "Debug Contracts",
              href: "/debug",
              icon: BugAntIcon,
            },
          ]}
        />
        <div className="flex flex-col w-full">
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
        <ProgressBar height="3px" color="#2299dd" />
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme()}
        >
          <ScaffoldEthApp>
            {children}
            <Toaster /> {/* Notifications */}
          </ScaffoldEthApp>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
