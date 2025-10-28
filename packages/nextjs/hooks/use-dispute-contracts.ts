import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export enum DisputeStatus {
  Waiting = 0,
  Appealable = 1,
  Solved = 2,
}

export enum Ruling {
  RefusedToArbitrate = 0,
  FreelancerWins = 1,
  ClientWins = 2,
}

export function useDisputeContracts(disputeId?: number) {
  // Arbitration proxy reads
  const { data: disputeCurrentRuling, isLoading: isDisputeCurrentRulingLoading } = useScaffoldReadContract({
    contractName: "ArbiterProxy",
    functionName: "getCurrentRuling",
    args: disputeId ? [BigInt(disputeId)] : [undefined],
    watch: !!disputeId,
  });

  const { data: disputeStatus, isLoading: isDisputeStatusLoading } = useScaffoldReadContract({
    contractName: "ArbiterProxy",
    functionName: "getDisputeStatus",
    args: disputeId ? [BigInt(disputeId)] : [undefined],
    watch: !!disputeId,
  });

  // Arbitration fee reads
  const { data: arbitrationCost, isLoading: isArbitrationCostLoading } = useScaffoldReadContract({
    contractName: "HiredTalentsContract",
    functionName: "getArbitrationFee",
    watch: !!disputeId,
  });

  const { data: freelancerFee, isLoading: isFreelancerFeeLoading } = useScaffoldReadContract({
    contractName: "ArbiterProxy",
    functionName: "getAppealCost",
    args: disputeId ? [BigInt(disputeId), BigInt(Ruling.FreelancerWins)] : [undefined, undefined],
    watch: !!disputeId,
  });

  const { data: clientFee, isLoading: isClientFeeLoading } = useScaffoldReadContract({
    contractName: "ArbiterProxy",
    functionName: "getAppealCost",
    args: disputeId ? [BigInt(disputeId), BigInt(Ruling.ClientWins)] : [undefined, undefined],
    watch: !!disputeId,
  });

  const { data: appealDeadline, isLoading: isAppealDeadlineLoading } = useScaffoldReadContract({
    contractName: "ArbiterProxy",
    functionName: "getAppealDeadline",
    args: disputeId ? [BigInt(disputeId)] : [undefined],
    watch: !!disputeId,
  });

  return {
    disputeCurrentRuling: disputeCurrentRuling as Ruling | undefined,
    isDisputeCurrentRulingLoading,
    disputeStatus: disputeStatus as DisputeStatus | undefined,
    isDisputeStatusLoading,
    arbitrationCost: arbitrationCost as number | undefined,
    isArbitrationCostLoading,
    freelancerFee: freelancerFee as number | undefined,
    isFreelancerFeeLoading,
    clientFee: clientFee as number | undefined,
    isClientFeeLoading,
    appealDeadline: appealDeadline as bigint | undefined,
    isAppealDeadlineLoading,
  };
}
