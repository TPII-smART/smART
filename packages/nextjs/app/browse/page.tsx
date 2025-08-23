"use client";

import { useState } from "react";
import BrowsePage from "~~/components/Browser";
import Tabs from "~~/components/Tabs/Tabs";
import { Tab } from "~~/components/Tabs/types";

type BrowserTab = "job" | "gig";

const tabs: Tab[] = [
  { id: "job", label: "Jobs" },
  { id: "gig", label: "Gigs" },
];

export default function BrowseJobsPage() {
  const [selectedTab, setSelectedTab] = useState<BrowserTab>(tabs[0].id.toString() as BrowserTab);

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "287px 1fr 15px",
        }}
      >
        <div className="w-64" />
        <Tabs
          tabs={tabs}
          onChange={id => {
            setSelectedTab(id.toString() as BrowserTab);
          }}
        />
      </div>
      <BrowsePage type={selectedTab} />
    </div>
  );
}
