"use client";

import { Suspense, lazy, useState } from "react";
import Tabs from "~~/components/Tabs/Tabs";
import { Tab, TabProps } from "~~/components/Tabs/types";

const JobsListing = lazy(() => import("@/components/JobsList/JobsList"));

const tabs: TabProps[] = [
  { id: "my-jobs-list", label: "My Jobs" },
  { id: "my-gigs-list", label: "My Gigs" },
];

const getPage = (tab: Tab): React.ReactNode => {
  switch (tab.id) {
    case tabs[0].id:
      return <JobsListing />;
    case tabs[1].id:
      return <div>Content for My Gigs</div>;
  }
};

const Dashboard = () => {
  const [selectedTab, setSelectedTab] = useState<Tab>(tabs[0]);

  const handleTabChange = (id: string | number, label?: string) => {
    setSelectedTab({ id, label: label ?? "" });
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div style={{ width: "66%", placeSelf: "center" }}>
        <Tabs tabs={tabs} onChange={handleTabChange} />
      </div>
      <Suspense>{getPage(selectedTab)}</Suspense>
    </div>
  );
};

export default Dashboard;
