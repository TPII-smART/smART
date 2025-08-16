import { JobStateEnum } from "~~/types/job/job.types";

export const jobState = [
  { id: JobStateEnum.WaitingForApproval, label: "Waiting For Approval" },
  { id: JobStateEnum.Ongoing, label: "Ongoing" },
  { id: JobStateEnum.Finished, label: "Finished" },
  { id: JobStateEnum.Cancelled, label: "Cancelled" },
  { id: JobStateEnum.Disputed, label: "Disputed" },
];
