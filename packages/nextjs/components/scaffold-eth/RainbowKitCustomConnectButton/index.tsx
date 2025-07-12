"use client";

import { Faucet, FaucetButton, isENS } from "..";
import { Balance } from "../Balance/Balance";
import { BlockieAvatar } from "../BlockieAvatar";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Address } from "viem";
import { hardhat } from "viem/chains";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useNetworkColor } from "~~/hooks/scaffold-eth";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */
export const RainbowKitCustomConnectButton = () => {
  const networkColor = useNetworkColor();
  const { targetNetwork } = useTargetNetwork();

  const isLocalNetwork = targetNetwork.id === hardhat.id;

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;
        const blockExplorerAddressLink = account
          ? getBlockExplorerAddressLink(targetNetwork, account.address)
          : undefined;

        return (
          <>
            {(() => {
              if (!connected) {
                return (
                  <button className="btn btn-primary btn-sm" onClick={openConnectModal} type="button">
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported || chain.id !== targetNetwork.id) {
                return <WrongNetworkDropdown />;
              }

              return (
                <div className="gap-2 flex flex-row-reverse max-w-[200px]">
                  <AddressInfoDropdown
                    address={account.address as Address}
                    blockExplorerAddressLink={blockExplorerAddressLink}
                  >
                    <summary
                      className={`"pr-2" btn btn-secondary btn-sm pl-0 ml-1 shadow-md dropdown-toggle gap-0 h-auto!`}
                      style={{ transition: "all 0.5s ease-in-out" }}
                    >
                      <BlockieAvatar address={account.address} size={30} ensImage={account.ensAvatar} />

                      <span className="ml-2 mr-1 whitespace-nowrap overflow-hidden text-ellipsis">
                        {isENS(account.displayName)
                          ? account.displayName
                          : account.address?.slice(0, 6) + "..." + account.address?.slice(-4)}
                      </span>
                    </summary>
                  </AddressInfoDropdown>
                  {isLocalNetwork && (
                    <div className="flex flex-row items-center gap-2">
                      <FaucetButton />
                      <Faucet />
                      <label className="btn btn-primary btn-sm font-normal gap-1">
                        <MagnifyingGlassIcon
                          className="h-4 w-4"
                          onClick={() => (window.location.href = "/blockexplorer")}
                        />
                      </label>
                    </div>
                  )}
                  <div className="flex flex-col items-center mr-1">
                    <Balance address={account.address as Address} className="min-h-0 h-auto" />
                    <span className="text-xs" style={{ color: networkColor }}>
                      {chain.name}
                    </span>
                  </div>
                  <AddressQRCodeModal address={account.address as Address} modalId="qrcode-modal" />
                </div>
              );
            })()}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};
