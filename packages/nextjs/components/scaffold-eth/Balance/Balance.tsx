"use client";

import { BalanceProps } from "./types";
import { formatEther } from "viem";
import Skeleton from "~~/components/Skeleton/Skeleton";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useDisplayUsdMode } from "~~/hooks/scaffold-eth/useDisplayUsdMode";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { useWatchBalance } from "~~/hooks/scaffold-eth/useWatchBalance";
import { useGlobalState } from "~~/services/store/store";

/**
 * Display (ETH & USD) balance of an ETH address.
 */
export const Balance = ({ address, className = "", usdMode, chainName }: BalanceProps) => {
  const { targetNetwork } = useTargetNetwork();
  const networkColor = useNetworkColor();
  const nativeCurrencyPrice = useGlobalState(state => state.nativeCurrency.price);
  const isNativeCurrencyPriceFetching = useGlobalState(state => state.nativeCurrency.isFetching);

  const {
    data: balance,
    isError,
    isLoading,
  } = useWatchBalance({
    address,
  });

  const { displayUsdMode, toggleDisplayUsdMode } = useDisplayUsdMode({ defaultUsdMode: usdMode });

  if (!address || isLoading || balance === null || (isNativeCurrencyPriceFetching && nativeCurrencyPrice === 0)) {
    return <Skeleton width={120} height={"100%"} variant="rounded" />;
  }

  if (isError) {
    return (
      <div className="border-2 border-secondary-content/30 rounded-md px-2 flex flex-col items-center max-w-fit cursor-pointer">
        <div className="text-warning">Error</div>
      </div>
    );
  }

  const formattedBalance = balance ? Number(formatEther(balance.value)) : 0;

  return (
    <div className="flex flex-col items-center mr-1">
      <button
        className={`btn btn-sm btn-ghost flex flex-col font-normal items-center hover:bg-transparent ${className} text-xs max-h-[16px]`}
        onClick={toggleDisplayUsdMode}
        type="button"
      >
        <div className="w-full flex items-center justify-center text-xs">
          {displayUsdMode ? (
            <>
              <span className="text-[1em] font-bold mr-1">$</span>
              <span>{(formattedBalance * nativeCurrencyPrice).toFixed(2)}</span>
            </>
          ) : (
            <>
              <span>{formattedBalance.toFixed(4)}</span>
              <span className="text-[1em] font-bold ml-1">{targetNetwork.nativeCurrency.symbol}</span>
            </>
          )}
        </div>
      </button>
      <span className="text-xs" style={{ color: networkColor }}>
        {chainName}
      </span>
    </div>
  );
};
