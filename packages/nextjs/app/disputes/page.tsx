"use client";

import { useState } from "react";
import DisputeListing from "~~/components/DisputeListing";
import Tabs from "~~/components/Tabs/Tabs";
import { Tab } from "~~/components/Tabs/types";

type DisputeType = "Appelable" | "participated";

const tabs: Tab[] = [
  { id: "Appelable", label: "Appelable Disputes" },
  { id: "participated", label: "Participated Disputes" },
];

export default function DisputesPage() {
  const initialTab = "Appelable" as DisputeType;
  const [selectedTab, setSelectedTab] = useState<DisputeType>(initialTab);

  const handleTabChange = (tabId: string | number) => {
    setSelectedTab(tabId as DisputeType);
  };

  return (
    <div className="h-full bg-background">
      {/* Header con Tabs - mismo padding que DisputeListing */}
      <div className="mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Tabs tabs={tabs} onChange={handleTabChange} initialSelectedTab={selectedTab} />
      </div>

      <DisputeListing type={selectedTab} />
    </div>
  );
}
