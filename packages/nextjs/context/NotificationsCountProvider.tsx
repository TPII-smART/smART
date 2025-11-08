import React, { ReactNode, createContext, useContext, useEffect, useRef } from "react";
import { NotificationStatus } from "@se-2/common";
import { QueryObserverResult, RefetchOptions, useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { fetchNotificationIdsByUser } from "~~/services/graphql/fetchers/notification/notification.service";
import { ZERO_ADDRESS } from "~~/utils/scaffold-eth/common";

type NotificationsContextType = {
  refreshUnreadCount: (options?: RefetchOptions | undefined) => Promise<QueryObserverResult<number, Error>>;
  unreadCount: number;
  notificationStatusCache: { [key in NotificationStatus]: Set<string> };
  saveCache: () => void;
  editCache: (id: string, status: NotificationStatus) => void;
  getState: (id: string) => NotificationStatus | undefined;
};

const REFRESH = 10 * 60 * 1000; // 10 minutes

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { address: userAddress } = useAccount();
  const notificationStatusCache = useRef<{ [key in NotificationStatus]: Set<string> }>({
    [NotificationStatus.UNREAD]: new Set(),
    [NotificationStatus.READ]: new Set(),
    [NotificationStatus.DONE]: new Set(),
  });

  const [mounted, setMounted] = React.useState(false);

  const saveCache = () => {
    const notificationStatusCacheObj: { [key in NotificationStatus]: string[] } = {
      [NotificationStatus.UNREAD]: Array.from(notificationStatusCache.current[NotificationStatus.UNREAD]),
      [NotificationStatus.READ]: Array.from(notificationStatusCache.current[NotificationStatus.READ]),
      [NotificationStatus.DONE]: Array.from(notificationStatusCache.current[NotificationStatus.DONE]),
    };

    localStorage.setItem("notificationStatusCache", JSON.stringify(notificationStatusCacheObj));
  };

  const editCache = (id: string, status: NotificationStatus) => {
    // Remove from all statuses
    [NotificationStatus.UNREAD, NotificationStatus.READ, NotificationStatus.DONE].forEach(s => {
      notificationStatusCache.current[s as NotificationStatus]?.delete(id);
    });
    // Add to the new status
    notificationStatusCache.current[status].add(id);
  };

  const getState = (id: string): NotificationStatus | undefined => {
    for (const status of [NotificationStatus.UNREAD, NotificationStatus.READ, NotificationStatus.DONE]) {
      if (notificationStatusCache.current[status as NotificationStatus]?.has(id)) {
        return status as NotificationStatus;
      }
    }
    return undefined;
  };

  useEffect(() => {
    if (!userAddress) return;
    const defaultCache = {
      [NotificationStatus.UNREAD]: [],
      [NotificationStatus.READ]: [],
      [NotificationStatus.DONE]: [],
    } as { [key in NotificationStatus]: string[] };

    let parsed: { [key in NotificationStatus]: string[] } = defaultCache;
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("notificationStatusCache");
        parsed = raw ? JSON.parse(raw) : defaultCache;
        parsed = {
          [NotificationStatus.UNREAD]: parsed[NotificationStatus.UNREAD] ?? [],
          [NotificationStatus.READ]: parsed[NotificationStatus.READ] ?? [],
          [NotificationStatus.DONE]: parsed[NotificationStatus.DONE] ?? [],
        };
      } catch (e) {
        console.warn("Failed to parse notificationStatusCache, resetting to default", e);
        parsed = defaultCache;
      }
    }

    notificationStatusCache.current = {
      [NotificationStatus.UNREAD]: new Set(parsed[NotificationStatus.UNREAD] || []),
      [NotificationStatus.READ]: new Set(parsed[NotificationStatus.READ] || []),
      [NotificationStatus.DONE]: new Set(parsed[NotificationStatus.DONE] || []),
    };

    setMounted(true);

    return () => {
      saveCache();
    };
  }, [userAddress]);

  const getReadCount = (): number => {
    return (
      notificationStatusCache.current[NotificationStatus.READ].size +
      notificationStatusCache.current[NotificationStatus.DONE].size
    );
  };

  const { data: unreadCount, refetch: refreshUnreadCount } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: async () => {
      const notificationIds = await fetchNotificationIdsByUser(userAddress ?? ZERO_ADDRESS);
      return notificationIds.length - getReadCount();
    },
    enabled: !!userAddress && mounted,
    refetchInterval: REFRESH,
  });

  if (!mounted) {
    return null;
  }

  return (
    <NotificationsContext.Provider
      value={{
        refreshUnreadCount,
        unreadCount: unreadCount ?? 0,
        notificationStatusCache: notificationStatusCache.current,
        saveCache,
        editCache,
        getState,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useGlobalNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) throw new Error("useGlobalNotifications must be used within NotificationsProvider");
  return context;
};
