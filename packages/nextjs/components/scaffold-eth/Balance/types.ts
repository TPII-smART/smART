import { Address } from "viem";

export type BalanceProps = {
  /**
   * The address to display the balance for.
   */
  address?: Address;
  /**
   * If true, the balance will not be wrapped in a link to the block explorer.
   * This is useful if you want to display the balance without linking it.
   * Default is false.
   */
  className?: string;
  /**
   * If true, the balance will be displayed in USD mode.
   * This will show the balance in USD instead of the native currency.
   * Default is false.
   */
  usdMode?: boolean;
};
