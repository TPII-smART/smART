"use client";

import { useParams } from "next/navigation";
import { DeliverablesHistory } from "~~/components/deliverableHistory/DeliverablesHistory";
import { DeliverableHistoryProps } from "~~/components/deliverableHistory/types";

export default function DeliverablesPage() {
  const { talentId, hiredTalentId } = useParams();
  const deliverableProps: DeliverableHistoryProps = {
    type: "talent",
    mainId: talentId as string,
    secondaryId: hiredTalentId as string,
  };

  return <DeliverablesHistory {...deliverableProps} />;
}
