import { HiredTalentState } from "~~/types/hiredTalent/hiredTalent.types";

export const hiredTalentState = [
  { id: HiredTalentState.WaitingForApproval, label: "Waiting For Approval" },
  { id: HiredTalentState.Ongoing, label: "Ongoing" },
  { id: HiredTalentState.Finished, label: "Finished" },
  { id: HiredTalentState.Cancelled, label: "Cancelled" },
  { id: HiredTalentState.Disputed, label: "Disputed" },
];
