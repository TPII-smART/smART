"use client";

import React from "react";
import { Faucet, FaucetButton, isENS } from "..";
import { Balance } from "../Balance/Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Address } from "viem";
import { hardhat } from "viem/chains";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import AvatarImage from "~~/components/AvatarImage/AvatarImage";
import Skeleton from "~~/components/Skeleton/Skeleton";
import { useUserContext } from "~~/context/UserProvider";
import { useTargetNetwork } from "~~/hooks/scaffold-eth/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-eth";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */

export const RainbowKitCustomConnectButton = () => {
  const { savedUser, loadingUser } = useUserContext();
  const { targetNetwork } = useTargetNetwork();

  const isLocalNetwork = targetNetwork.id === hardhat.id;

  // const { userProfile, setUserProfile } = useUserProfile();
  // const { address } = useAccount();

  // useEffect(() => {
  //   if (address) {
  //     fetchUserProfile(address)
  //       .then(profile => setUserProfile(profile))
  //       .catch(() => setUserProfile(null));
  //   }
  // }, [address, setUserProfile]);

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;
        const blockExplorerAddressLink = account
          ? getBlockExplorerAddressLink(targetNetwork, account.address)
          : undefined;

        //const avatarImage = userProfile?.profilePicture || account?.ensAvatar;

        return (
          <Skeleton variant="rounded" active={!mounted || !chain} width={200}>
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
                      className={`pr-2 btn btn-secondary btn-sm pl-0 ml-1 shadow-md dropdown-toggle gap-0 h-auto!`}
                      style={{ transition: "all 0.5s ease-in-out" }}
                    >
                      <AvatarImage
                        src={savedUser?.profilePicture ?? account.ensAvatar}
                        address={account.address as `0x${string}`}
                        width={30}
                        height={30}
                        loading={loadingUser}
                      />

                      {loadingUser ? (
                        <div className="ml-2">
                          <Skeleton variant="rounded" width={100} height={15} />
                        </div>
                      ) : (
                        <span className="ml-2 mr-1 whitespace-nowrap overflow-hidden text-ellipsis text-sm">
                          {savedUser?.username ??
                            (isENS(account?.displayName)
                              ? account?.displayName
                              : account?.address?.slice(0, 6) + "..." + account?.address?.slice(-4))}
                        </span>
                      )}
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
                  <div>
                    <Balance address={account.address as Address} chainName={chain?.name} className="min-h-0 h-auto" />
                  </div>
                  <AddressQRCodeModal address={account.address as Address} modalId="qrcode-modal" />
                </div>
              );
            })()}
          </Skeleton>
        );
      }}
    </ConnectButton.Custom>
  );
};
