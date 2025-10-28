export enum DisputeStatus {
  Waiting = 0,
  Appealable = 1,
  Solved = 2,
}

export interface Dispute {
  disputeId: number;
  arbiterDisputeId: number;
  type: "hiredTalent" | "gig";
  title: string;
  description: string;
  disputeReason: string;
  raiseOnKleros: boolean;
  freelancerPaidArbitrationFee: boolean;
  clientPaidArbitrationFee: boolean;
  roundDeadline: string;
  currentRound: number;
  currentRuling: number;
  freelancerFunds: number;
  clientFunds: number;
  freelancerFee: number;
  clientFee: number;
  appealCost: number;
  status: DisputeStatus;
  contributors: string[];
  disputeFinished: boolean;
  isAppealed: boolean;
}
