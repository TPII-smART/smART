"use client";

import { DeliverableGigHistory } from "./DeliverableGigHistory";
import { DeliverableJobHistory } from "./DeliverableJobHistory";
import { DeliverableHistoryProps } from "./types";

export function DeliverablesHistory(deliverableProps: DeliverableHistoryProps) {
  if (deliverableProps.type === "job") {
    return <DeliverableJobHistory {...deliverableProps} />;
  }
  if (deliverableProps.type === "gig") {
    return <DeliverableGigHistory {...deliverableProps} />;
  }
  return null;
}
