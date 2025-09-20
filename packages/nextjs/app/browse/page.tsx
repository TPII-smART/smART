"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BrowsePage from "~~/components/Browser";
import Tabs from "~~/components/Tabs/Tabs";
import { Tab } from "~~/components/Tabs/types";

type BrowserTab = "job" | "gig";

const tabs: Tab[] = [
  { id: "job", label: "Jobs" },
  { id: "gig", label: "Gigs" },
];

export default function BrowseJobsPage() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as BrowserTab) || tabs[0].id;
  const [selectedTab, setSelectedTab] = useState<BrowserTab>(initialTab);
  const router = useRouter();

  const handleTabChange = (id: string | number) => {
    setSelectedTab(id.toString() as BrowserTab);
    router.replace(`/browse?tab=${id}`);
  };

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "287px 1fr 15px",
        }}
      >
        <div className="w-64" />
        <Tabs tabs={tabs} onChange={handleTabChange} initialSelectedTab={selectedTab} />
      </div>
      <BrowsePage type={selectedTab} />
    </div>
  );
}
