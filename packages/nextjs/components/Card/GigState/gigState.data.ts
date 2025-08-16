import { GigStateEnum } from "~~/types/gig.types";

export const gigState = [
  { id: GigStateEnum.Open, label: "Hearing Offers" },
  { id: GigStateEnum.InProgress, label: "In Progress" },
  { id: GigStateEnum.Completed, label: "Finished" },
  { id: GigStateEnum.Cancelled, label: "Cancelled" },
  { id: GigStateEnum.Disputed, label: "Disputed" },
];
