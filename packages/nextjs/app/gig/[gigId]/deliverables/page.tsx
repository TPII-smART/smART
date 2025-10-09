"use client";

import { useParams } from "next/navigation";
import { DeliverablesHistory } from "~~/components/deliverableHistory/DeliverablesHistory";
import { DeliverableHistoryProps } from "~~/components/deliverableHistory/types";

export default function DeliverablesPage() {
  const { gigId } = useParams();
  const deliverableProps: DeliverableHistoryProps = {
    type: "gig",
    mainId: gigId as string,
    secondaryId: "",
  };

  return <DeliverablesHistory {...deliverableProps} />;
}
