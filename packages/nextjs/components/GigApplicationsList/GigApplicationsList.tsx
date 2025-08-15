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
import { fetchApplicationsWithGigDetails } from "~~/services/graphql/fetchers/gig/gig.service";
import { Application, ApplicationsData, Gig, GigState } from "~~/types/gig/gig.types";

interface InfoIcons {
  title: string;
  icon: JSX.Element;
  info: string | number | undefined;
}

const tabs: TabProps[] = [
  {
    id: GigState.Open,
    label: "Pending",
  },
  {
    id: GigState.InProgress,
    label: "In Progress",
  },
  {
    id: GigState.Completed,
    label: "Finished",
  },
  {
    id: GigState.Cancelled,
    label: "Cancelled",
  },
  {
    id: GigState.Disputed,
    label: "Disputed",
  },
];

const getInfoIcons = (item: Partial<Application> & ListItemProps, currentTab: GigState): InfoIcons[] => {
  const infoIcons: InfoIcons[] = [];
  console.log(item);

  if (currentTab === GigState.Open) {
    infoIcons.push({
      title:
        "Gig duration, original: " +
        item.gig?.maxDurationInHours +
        " hours / proposed: " +
        item.proposedDurationInHours +
        " hours",
      icon: <ClockIcon className="w-4 h-4" />,
      info: item.gig?.maxDurationInHours + " hours / " + item.proposedDurationInHours + " hours",
    });
  } else if (currentTab === GigState.InProgress) {
    infoIcons.push({
      title: `Deadline: ${item.gig?.deadline}`,
      icon: <FlagIcon className="w-4 h-4" />,
      info: item.gig?.deadline,
    });

    infoIcons.push({
      title: item.gig?.freelancerDelivered
        ? "The freelancer has delivered the work"
        : "The freelancer has not yet delivered the work",
      icon: item.gig?.freelancerDelivered ? (
        <EnvelopeIcon className="w-4 h-4" />
      ) : (
        <EnvelopeOpenIcon className="w-4 h-4" />
      ),
      info: item.gig?.freelancerDelivered ? "Submitted" : "Not submitted",
    });
  } else if (currentTab === GigState.Completed) {
    if (item.gig?.finishedAt) {
      infoIcons.push({
        title: "Finished At",
        icon: <BookmarkIcon className="w-4 h-4" />,
        info: new Date(+item.gig?.finishedAt * 1000).toLocaleDateString(window.navigator.language, {
          dateStyle: "medium",
        }),
      });
    }

    infoIcons.push({
      title: item.gig?.clientReceived
        ? "The client received the deliverables"
        : "The client has not yet received the deliverables",
      icon: item.gig?.clientReceived ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />,
      info: item.gig?.clientReceived ? "Received" : "Not received",
    });
  } else if (currentTab === GigState.Cancelled) {
    if (item.gig?.canceledAt) {
      infoIcons.push({
        title: "Canceled At",
        icon: <XCircleIcon className="w-4 h-4" />,
        info: new Date(+item.gig?.canceledAt * 1000).toLocaleDateString(window.navigator.language, {
          dateStyle: "medium",
        }),
      });
    }
  }

  infoIcons.push({
    title:
      "Gig payment, original payment: " +
      item.gig?.basePayment +
      " Ethereum / proposed: " +
      item.proposedPayment +
      " Ethereum",
    icon: <CurrencyDollarIcon className="w-4 h-4" />,
    info: "Ξ " + item.gig?.basePayment + " / Ξ " + item.proposedPayment,
  });

  return infoIcons;
};

const GigsList = () => {
  const { address: userAddress } = useAccount();
  const { data } = useQuery<ApplicationsData>({
    queryKey: ["gigsFromUser", userAddress],
    queryFn: () => fetchApplicationsWithGigDetails(userAddress || ""),
    refetchInterval: 1000 * 60 * 5,
  });

  const [selectedTab, setSelectedTab] = useState<Tab>(tabs[0]);
  const [filteredData, setFilteredData] = useState<(Application & ListItemProps)[]>([]);

  const handleTabChange = (id: string | number, label?: string) => {
    setSelectedTab({ id, label: label ?? "" });
  };

  useEffect(() => {
    if (data) {
      console.log(data);
      setFilteredData(
        data.applications
          .filter(app => app.gig?.state === selectedTab.id)
          .map(app => ({
            ...app,
            gig: {
              ...(app.gig ?? ({} as Gig)),
              basePayment: formatEther(BigInt(app.gig?.basePayment ?? "0")).toString(),
              finalPayment: formatEther(BigInt(app.gig?.finalPayment ?? "0")).toString(),
            },
            proposedPayment: formatEther(BigInt(app.proposedPayment ?? "0")).toString(),
            deadline:
              app.gig?.deadline && app.gig?.deadline != 0
                ? new Date(+app.gig?.deadline * 1000).toLocaleDateString(window.navigator.language, {
                    dateStyle: "medium",
                  })
                : undefined,
            id: app.gigId,
            title: app.gig?.title ?? "",
            description: app.gig?.description ?? "",
            userAddress: app.gig?.client,
          })),
      );
    }
  }, [data, selectedTab]);

  return (
    <div className="flex flex-col h-full w-full px-10">
      <Tabs tabs={tabs} onChange={handleTabChange} />
      <div className="p-10 w-full">
        <List<Gig>
          secondaryAction={item => {
            const infoIcons: InfoIcons[] = getInfoIcons(item, selectedTab.id as GigState);

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

export default GigsList;
