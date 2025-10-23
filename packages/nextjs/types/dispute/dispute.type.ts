export interface Dispute {
  disputeId: number;
  arbiterDisputeId: number;
  title: string;
  description: string;
  disputeReason: string;
  raiseOnKleros: boolean;
  freelancerPaidArbitrationFee: boolean;
  clientPaidArbitrationFee: boolean;
  disputeDeadline: string;
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
