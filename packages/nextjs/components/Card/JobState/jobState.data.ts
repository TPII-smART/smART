import { JobState } from "@se-2/common";

export const jobState = [
  { id: JobState.WaitingForApproval, label: "Waiting For Approval" },
  { id: JobState.Ongoing, label: "Ongoing" },
  { id: JobState.Finished, label: "Finished" },
  { id: JobState.Cancelled, label: "Cancelled" },
  { id: JobState.Disputed, label: "Disputed" },
];
