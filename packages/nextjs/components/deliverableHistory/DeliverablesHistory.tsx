"use client";

import { DeliverableGigHistory } from "./DeliverableGigHistory";
import { DeliverableTalentHistory } from "./DeliverableTalentHistory";
import { DeliverableHistoryProps } from "./types";

export function DeliverablesHistory(deliverableProps: DeliverableHistoryProps) {
  if (deliverableProps.type === "talent") {
    return <DeliverableTalentHistory {...deliverableProps} />;
  }
  if (deliverableProps.type === "gig") {
    return <DeliverableGigHistory {...deliverableProps} />;
  }
  return null;
}
