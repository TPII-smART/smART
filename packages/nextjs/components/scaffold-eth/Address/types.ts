import { Address } from "viem";

export type AddressProps = {
  /**
   * The address to display. If not provided, the component will not render anything.
   * If provided, it can be a valid Ethereum address or an ENS name.
   * If the address is an ENS name, it will be resolved to an address.
   * If the address is not valid, it will not render anything.
   */
  address?: Address;
  /**
   * If true, the address will not be wrapped in a link to the block explorer.
   * This is useful if you want to display the address without linking it.
   * Default is false.
   */
  disableAddressLink?: boolean;
  /**
   * The format of the address to display.
   * If "short", it will display the first 6 and last 4 characters of the address.
   * If "long", it will display the full address.
   * Default is "short".
   */
  format?: "short" | "long";
  /**
   * The size of the address text.
   * Can be one of "xs", "sm", "base", "lg", "xl", "2xl", or "3xl".
   * Default is "base".
   */
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";
  /**
   * If true, the component will only display the ENS name or address without any additional formatting.
   * This is useful for displaying just the ENS name or address without any additional styling.
   * Default is false.
   */
  onlyEnsOrAddress?: boolean;
};

export type AddressLinkWrapperProps = {
  /**
   * The children to render inside the link wrapper.
   * This should be the address or ENS name to display.
   * It can be any valid React node, such as a string, number, or JSX element.
   * If the address is not valid, it will not render anything.
   */
  children: React.ReactNode;
  /**
   * If true, the address will not be wrapped in a link to the block explorer.
   * This is useful if you want to display the address without linking it.
   * Default is false.
   */
  disableAddressLink?: boolean;
  /**
   * The URL to the block explorer for the address.
   * This should be a valid URL that points to the block explorer for the network the address is on.
   * If the address is not valid, it will not render anything.
   * Example: "https://etherscan.io/address/"
   */
  blockExplorerAddressLink: string;
};
