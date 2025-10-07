import { Deliverable } from "~~/types/deliverable";
import { Gig } from "~~/types/gig";
import { Job } from "~~/types/job";

type DeliverableHistoryProps = {
  mainId: string;
  secondaryId: string;
  type: "job" | "gig";
};

type JobHistoryData = {
  job: Job;
  deliverables: Deliverable[];
};

type GigHistoryData = {
  gig: Gig;
  deliverables: Deliverable[];
};

type HistoryData = JobHistoryData | GigHistoryData;

export type { DeliverableHistoryProps, HistoryData, JobHistoryData, GigHistoryData };
