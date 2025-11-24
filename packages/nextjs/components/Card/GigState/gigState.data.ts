import { GigState } from "~~/types/gig/gig.types";

export const gigState = [
  { id: GigState.Open, label: "Hearing Offers" },
  { id: GigState.InProgress, label: "In Progress" },
  { id: GigState.Completed, label: "Finished" },
  { id: GigState.Cancelled, label: "Cancelled" },
  { id: GigState.Disputed, label: "Disputed" },
];
