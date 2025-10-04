import { JSX, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ComboBox from "../ComboBox/ComboBox";
import List from "../List/List";
import { ListItemProps } from "../List/types";
import { hiredTalentState } from "@/components/Card/HiredTalentState/hiredTalentState.data";
import { HiredTalentState } from "@se-2/common";
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
  MagnifyingGlassIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { castHoursToDurationString } from "~~/lib/utils";
// Adjust the import to match the actual export from the module
import { fetchMyHiredTalents } from "~~/services/graphql/fetchers/hiredTalent/hiredTalent.service";
import { HiredTalent, HiredTalentsData } from "~~/types/hiredTalent/hiredTalent.types";

interface InfoIcons {
  title: string;
  icon: JSX.Element;
  info: string | number | undefined;
}

const getInfoIcons = (item: Partial<HiredTalent> & ListItemProps, currentState: HiredTalentState): InfoIcons[] => {
  const infoIcons = [];

  if (currentState === HiredTalentState.WaitingForApproval) {
    infoIcons.push({
      title: `Hire Duration: ${castHoursToDurationString(+(item.hiredTalentDuration ?? "0"))}`,
      icon: <ClockIcon className="w-4 h-4" />,
      info: castHoursToDurationString(+(item.hiredTalentDuration ?? "0")),
    });
  } else if (currentState === HiredTalentState.Ongoing) {
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
  } else if (currentState === HiredTalentState.Finished) {
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
  } else if (currentState === HiredTalentState.Cancelled) {
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

const HiredTalentsList = () => {
  const router = useRouter();
  const { address: userAddress } = useAccount();
  const { data } = useQuery<HiredTalentsData>({
    queryKey: ["hiredTalentsFromUser", userAddress],
    queryFn: () => fetchMyHiredTalents(userAddress || ""),
    refetchInterval: 1000 * 60 * 5,
  });

  const [selectedState, setSelectedState] = useState<HiredTalentState>(HiredTalentState.WaitingForApproval);

  const filteredData = useMemo(() => {
    if (!data?.hiredTalents) return [];

    return data.hiredTalents
      .filter(hiredTalent => hiredTalent.state === selectedState)
      .map(hiredTalent => ({
        ...hiredTalent,
        payment: formatEther(BigInt(hiredTalent.payment ?? "0")).toString(),
        deadline:
          hiredTalent.deadline && hiredTalent.deadline != 0
            ? new Date(+hiredTalent.deadline * 1000).toLocaleDateString(window.navigator.language, {
                dateStyle: "medium",
              })
            : undefined,
        id: hiredTalent.talentId + "-" + hiredTalent.hiredTalentId,
        title: hiredTalent.title ?? "",
        description: hiredTalent.description ?? "",
        userAddress: hiredTalent.client,
      }));
  }, [data, selectedState]);

  const handleStateChange = (state: number) => {
    setSelectedState(state as HiredTalentState);
  };

  const handleInspectHiredTalent = (hiredTalent: HiredTalent) => {
    const searchParams = new URLSearchParams({
      search: hiredTalent.title || "",
      state: selectedState.toString(),
    });

    router.push(`/talents/${hiredTalent.talentId}?${searchParams.toString()}`);
  };

  return (
    <div className="flex flex-col h-full w-full px-10">
      <div className="mb-6">
        <ComboBox
          id="hiredTalent-state-filter"
          label="Filter by Hire State"
          onChange={handleStateChange}
          value={selectedState}
          options={hiredTalentState}
          variant="outlined"
        />
      </div>

      <div className="p-10 w-full">
        <List<HiredTalent>
          secondaryAction={item => {
            const infoIcons: InfoIcons[] = getInfoIcons(item, selectedState);

            return (
              <div className="flex flex-row h-full place-items-center space-x-6 justify-end">
                <div className="flex flex-col h-full place-items-center">
                  {infoIcons.map(({ title, icon, info }) => (
                    <div className="flex flex-row h-full place-items-center place-self-start" title={title} key={title}>
                      {icon}
                      <span className="ml-2">{info}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-row h-full place-items-center place-self-start mb-2">
                  <button
                    onClick={() => handleInspectHiredTalent(item as HiredTalent)}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    title="Inspect hire in talent"
                  >
                    <MagnifyingGlassIcon className="w-5 h-5 text-[color:var(--color-accent)]" />
                  </button>
                </div>
              </div>
            );
          }}
          items={filteredData}
        />
      </div>
    </div>
  );
};

export default HiredTalentsList;
