import { JSX, useEffect, useState } from "react";
import List from "../List/List";
import { ListItemProps } from "../List/types";
import Tabs from "../Tabs/Tabs";
import { Tab, TabProps } from "../Tabs/types";
import { useQuery } from "@tanstack/react-query";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import {
  BookmarkIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  EnvelopeIcon,
  EnvelopeOpenIcon,
  FlagIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
// Adjust the import to match the actual export from the module
import { fetchMyJobs } from "~~/services/graphql/fetchers/job.service";
import { Job, JobState, JobsData } from "~~/types/job.types";

interface InfoIcons {
  title: string;
  icon: JSX.Element;
  info: string | number | undefined;
}

const tabs: TabProps[] = [
  {
    id: JobState.WaitingForApproval,
    label: "Waiting for Approval",
  },
  {
    id: JobState.Ongoing,
    label: "Ongoing",
  },
  {
    id: JobState.Finished,
    label: "Finished",
  },
  {
    id: JobState.Cancelled,
    label: "Cancelled",
  },
  {
    id: JobState.Disputed,
    label: "Disputed",
  },
];

const getInfoIcons = (item: Partial<Job> & ListItemProps, currentTab: JobState): InfoIcons[] => {
  const infoIcons = [];

  console.log(item);

  if (currentTab === JobState.WaitingForApproval) {
    infoIcons.push({
      title: `Job Duration: ${item.jobDuration} hours`,
      icon: <ClockIcon className="w-4 h-4" />,
      info: item.jobDuration + " hours",
    });
  } else if (currentTab === JobState.Ongoing) {
    infoIcons.push({
      title: `Deadline: ${item.deadline}`,
      icon: <FlagIcon className="w-4 h-4" />,
      info: item.deadline,
    });

    infoIcons.push({
      title: item.freelancerDelivered
        ? "The freelancer has delivered the work"
        : "The freelancer has not yet delivered the work",
      icon: item.freelancerDelivered ? <EnvelopeIcon className="w-4 h-4" /> : <EnvelopeOpenIcon className="w-4 h-4" />,
      info: item.freelancerDelivered ? "Submitted" : "Not submitted",
    });
  } else if (currentTab === JobState.Finished) {
    if (item.finishedAt) {
      infoIcons.push({
        title: "Finished At",
        icon: <BookmarkIcon className="w-4 h-4" />,
        info: new Date(+item.finishedAt * 1000).toLocaleDateString(window.navigator.language, { dateStyle: "medium" }),
      });
    }

    infoIcons.push({
      title: item.clientReceived
        ? "The client received the deliverables"
        : "The client has not yet received the deliverables",
      icon: item.clientReceived ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />,
      info: item.clientReceived ? "Received" : "Not received",
    });
  } else if (currentTab === JobState.Cancelled) {
    if (item.canceledAt) {
      infoIcons.push({
        title: "Canceled At",
        icon: <XCircleIcon className="w-4 h-4" />,
        info: new Date(+item.canceledAt * 1000).toLocaleDateString(window.navigator.language, { dateStyle: "medium" }),
      });
    }
  }

  infoIcons.push({
    title: `Payment: ${item.payment} Ethereum`,
    icon: <CurrencyDollarIcon className="w-4 h-4" />,
    info: "Ξ " + item.payment,
  });

  return infoIcons;
};

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
            payment: formatEther(BigInt(job.payment ?? "0")).toString(),
            deadline:
              job.deadline && job.deadline != 0
                ? new Date(+job.deadline * 1000).toLocaleDateString(window.navigator.language, { dateStyle: "medium" })
                : undefined,
            id: job.postingId + "-" + job.jobId,
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
            const infoIcons: InfoIcons[] = getInfoIcons(item, selectedTab.id as JobState);

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
