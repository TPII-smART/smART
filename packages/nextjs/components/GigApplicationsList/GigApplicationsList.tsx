import { JSX, useMemo, useState } from "react";
import ComboBox from "../ComboBox/ComboBox";
import List from "../List/List";
import { ListItemProps } from "../List/types";
import { gigState } from "@/components/Card/GigState/gigState.data";
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
import { fetchApplicationsWithGigDetails } from "~~/services/graphql/fetchers/gig.service";
import { Application, ApplicationsData, Gig, GigStateEnum } from "~~/types/gig.types";

interface InfoIcons {
  title: string;
  icon: JSX.Element;
  info: string | number | undefined;
}

const getInfoIcons = (item: Partial<Application> & ListItemProps, currentState: GigStateEnum): InfoIcons[] => {
  const infoIcons: InfoIcons[] = [];

  if (currentState === GigStateEnum.Open) {
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
  } else if (currentState === GigStateEnum.InProgress) {
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
  } else if (currentState === GigStateEnum.Completed) {
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
  } else if (currentState === GigStateEnum.Cancelled) {
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

const GigApplicationsList = () => {
  const { address: userAddress } = useAccount();
  const { data } = useQuery<ApplicationsData>({
    queryKey: ["gigsFromUser", userAddress],
    queryFn: () => fetchApplicationsWithGigDetails(userAddress || ""),
    refetchInterval: 1000 * 60 * 5,
  });

  const [selectedState, setSelectedState] = useState<GigStateEnum>(GigStateEnum.Open);

  const filteredData = useMemo(() => {
    if (!data?.applications) return [];

    return data.applications
      .filter(app => app.gig?.state === selectedState)
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
      }));
  }, [data, selectedState]);

  const handleStateChange = (state: number) => {
    setSelectedState(state as GigStateEnum);
  };

  return (
    <div className="flex flex-col h-full w-full px-10">
      <div className="mb-6">
        <ComboBox
          id="gig-state-filter"
          label="Filter by Application State"
          onChange={handleStateChange}
          value={selectedState}
          options={gigState}
          variant="outlined"
        />
      </div>

      <div className="p-10 w-full">
        <List<Gig>
          secondaryAction={item => {
            const infoIcons: InfoIcons[] = getInfoIcons(item, selectedState);

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

export default GigApplicationsList;
