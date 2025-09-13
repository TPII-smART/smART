import React, { ReactNode, createContext, useContext } from "react";
import { QueryObserverResult, RefetchOptions, useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { fetchUnreadNotificationsAmountByUser } from "~~/services/graphql/fetchers/notification/notification.service";
import { ZERO_ADDRESS } from "~~/utils/scaffold-eth/common";

type NotificationsContextType = {
  refreshUnreadCount: (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<number, Error>>;
  unreadCount: number;
};

const REFRESH = 10 * 60 * 1000; // 10 minutes

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address: userAddress } = useAccount();

  const { data: unreadCount, refetch: refreshUnreadCount } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: async () => {
      return await fetchUnreadNotificationsAmountByUser(userAddress ?? ZERO_ADDRESS);
    },
    enabled: !!userAddress,
    refetchInterval: REFRESH,
  });

  return (
    <NotificationsContext.Provider value={{ refreshUnreadCount, unreadCount: unreadCount ?? 0 }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useGlobalNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useGlobalNotifications must be used within NotificationsProvider");
  return context;
};
