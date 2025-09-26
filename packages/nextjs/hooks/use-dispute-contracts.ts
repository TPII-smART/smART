import { useScaffoldReadContract } from "~~/hooks/scaffold-eth";

export function useDisputeContracts(disputeQuestionId?: string) {
  const validQuestionId =
    disputeQuestionId && typeof disputeQuestionId === "string" && disputeQuestionId.startsWith("0x")
      ? (disputeQuestionId as `0x${string}`)
      : "0x0000000000000000000000000000000000000000000000000000000000000000";

  // RealityETH reads
  const { data: disputeFinalized, isLoading: isDisputeFinalizedLoading } = useScaffoldReadContract({
    contractName: "RealityETH",
    functionName: "isFinalized",
    args: [validQuestionId],
    watch: !!disputeQuestionId,
  });

  const { data: disputeResultData, isLoading: isDisputeResultLoading } = useScaffoldReadContract({
    contractName: "RealityETH",
    functionName: "resultFor",
    args: [validQuestionId],
    watch: !!disputeQuestionId,
  });

  const { data: disputeBeingArbitrated, isLoading: isDisputeArbitrationLoading } = useScaffoldReadContract({
    contractName: "RealityETH",
    functionName: "isPendingArbitration",
    args: [validQuestionId],
    watch: !!disputeQuestionId,
  });

  const { data: lastSeenBond } = useScaffoldReadContract({
    contractName: "RealityETH",
    functionName: "getBond",
    args: [validQuestionId],
    watch: !!disputeQuestionId,
  });

  // ArbiterContract read
  const arbitrationFee = useScaffoldReadContract({
    contractName: "ArbiterContract",
    functionName: "arbitrationFee",
  });

  return {
    disputeFinalized,
    isDisputeFinalizedLoading,
    disputeResultData,
    isDisputeResultLoading,
    disputeBeingArbitrated,
    isDisputeArbitrationLoading,
    lastSeenBond,
    arbitrationFee,
  };
}
