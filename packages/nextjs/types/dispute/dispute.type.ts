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
  status: number;
  contributors: string[];
  disputeFinished: boolean;
}
