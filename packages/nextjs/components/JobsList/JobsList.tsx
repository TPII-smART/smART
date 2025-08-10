import { JSX, useEffect, useState } from "react";
import List from "../List/List";
import { ListItemProps } from "../List/types";
import Tabs from "../Tabs/Tabs";
import { Tab, TabProps } from "../Tabs/types";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  FlagIcon,
} from "@heroicons/react/24/outline";
import { fetchMyJobs } from "~~/services/graphql/fetchers/job.service";
import { Job, JobsData } from "~~/types/job.types";

interface InfoIcons {
  title: string;
  icon: JSX.Element;
  info: string | number | undefined;
}

const tabs: TabProps[] = [
  {
    id: 0,
    label: "Waiting for Approval",
  },
  {
    id: 1,
    label: "Ongoing",
  },
  {
    id: 2,
    label: "Finished",
  },
  {
    id: 3,
    label: "Cancelled",
  },
  {
    id: 4,
    label: "Disputed",
  },
];

const JobsList = () => {
  const { address: userAddress } = useAccount();
  const { data } = useQuery<JobsData>({
    queryKey: ["jobsFromUser", userAddress],
    queryFn: () => fetchMyJobs(userAddress || ""),
    refetchInterval: 1000 * 60 * 5,
  });

  const [selectedTab, setSelectedTab] = useState<Tab>(tabs[0]);
  const [filteredData, setFilteredData] = useState<(Job & ListItemProps)[]>([]);

  const handleTabChange = (id: string | number, label?: string) => {
    setSelectedTab({ id, label: label ?? "" });
  };

  useEffect(() => {
    if (data) {
      setFilteredData(
        data.jobs
          .filter(job => job.state === selectedTab.id)
          .map(job => ({
            ...job,
            payment: `${parseInt(job.payment ?? "0") / 1e18}`,
            deadline:
              job.deadline && job.deadline != 0
                ? new Date(+job.deadline * 1000).toLocaleDateString(window.navigator.language, { dateStyle: "medium" })
                : undefined,
            id: job.jobId,
            title: job.title ?? "",
            description: job.description ?? "",
            userAddress: job.client,
          })),
      );
    }
  }, [data, selectedTab]);

  return (
    <div className="flex flex-col h-full w-full px-10">
      <Tabs tabs={tabs} onChange={handleTabChange} />
      <div className="p-10 w-full">
        <List<Job>
          secondaryAction={item => {
            const infoIcons: InfoIcons[] = [
              item.deadline &&
                item.deadline != 0 && {
                  title: `Deadline: ${item.deadline}`,
                  icon: <FlagIcon className="w-4 h-4" />,
                  info: item.deadline,
                },
              item.jobDuration && {
                title: `Job Duration: ${item.jobDuration} hours`,
                icon: <ClockIcon className="w-4 h-4" />,
                info: item.jobDuration + " hours",
              },
              item.payment && {
                title: `Payment: ${item.payment}`,
                icon: <CurrencyDollarIcon className="w-4 h-4" />,
                info: item.payment + " ETH",
              },
              item.acceptedAt && {
                title: item.clientReceived
                  ? "The client received the deliverables"
                  : item.freelancerDelivered
                    ? "The freelancer has delivered the work"
                    : "The freelancer has not yet delivered the work",
                icon: item.clientReceived ? (
                  <CheckCircleIcon className="w-4 h-4" />
                ) : item.freelancerDelivered ? (
                  <EnvelopeIcon className="w-4 h-4" />
                ) : (
                  <EnvelopeOpenIcon className="w-4 h-4" />
                ),
                info: item.clientReceived ? "Received" : item.freelancerDelivered ? "Submitted" : "Not submitted",
              },
            ].filter(Boolean) as InfoIcons[];
            return (
              <div className="flex flex-col h-full place-items-center">
                {infoIcons.map(({ title, icon, info }) => (
                  <div className="flex flex-row h-full place-items-center place-self-start" title={title} key={title}>
                    {icon}
                    <span className="ml-2">{info}</span>
                  </div>
                ))}
              </div>
            );
          }}
          items={filteredData}
        />
      </div>
    </div>
  );
};

export default JobsList;
