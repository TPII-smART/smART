"use client";

import { useParams } from "next/navigation";
import { DeliverablesHistory } from "~~/components/deliverableHistory/DeliverablesHistory";
import { DeliverableHistoryProps } from "~~/components/deliverableHistory/types";

export default function DeliverablesPage() {
  const { postingId, jobId } = useParams();
  const deliverableProps: DeliverableHistoryProps = {
    type: "job",
    mainId: postingId as string,
    secondaryId: jobId as string,
  };

  return <DeliverablesHistory {...deliverableProps} />;
}
