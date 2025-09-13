"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { styled } from "@mui/material";
import { NotificationStatus } from "@se-2/common";
import { useAccount } from "wagmi";
import { EnvelopeIcon, EnvelopeOpenIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ArchiveBoxIcon, CheckCircleIcon, InboxIcon } from "@heroicons/react/24/solid";
import Button from "~~/components/Button";
import Checkbox from "~~/components/CheckBox/CheckBox";
import Spinner from "~~/components/Spinner/Spinner";
import { InputBase } from "~~/components/scaffold-eth";
import { useGlobalNotifications } from "~~/context/NotificationsCountProvider";
import { useGlobalSpinner } from "~~/context/SpinnerProvider";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { usePagination } from "~~/hooks/use-pagination";
import { castDateToTimestamp } from "~~/lib/utils";
import { waitTransaction } from "~~/lib/waitTransaction.util";
import { fetchNotificationsByUserPaginated } from "~~/services/graphql/fetchers/notification/notification.service";
import { Notification } from "~~/types/notification.types";

const SideBarButton = styled("button")<{ isActive: boolean }>(({ isActive }) => ({
  display: "flex",
  alignItems: "center",
  gap: "0.75rem",
  padding: "0.5rem",
  borderRadius: "0.5rem",
  transition: "background-color 0.2s, color 0.2s",
  backgroundColor: isActive ? "var(--color-accent)" : "transparent",
  color: isActive ? "var(--color-secondary-content)" : "var(--color-primary-content)",
  "&:hover": {
    backgroundColor: isActive ? "var(--color-accent)" : "var(--color-border)",
    color: isActive ? "var(--color-secondary-content)" : "var(--color-primary-content)",
  },
  width: "100%",
  justifyContent: "flex-start",
  cursor: "pointer",
}));

const NotificationCard = ({
  notification,
  checked,
  onChange,
  onNavigate,
}: {
  notification: Notification;
  checked: boolean;
  onChange: (id: string) => void;
  onNavigate: (status: NotificationStatus, ids: string[]) => Promise<void>;
}) => {
  const [createdAt, setCreatedAt] = useState<string>("");

  useEffect(() => {
    setCreatedAt(castDateToTimestamp(notification.createdAt));
  }, [notification.createdAt]);

  return (
    <Link
      key={notification.id}
      className={`
        flex items-center p-4 rounded-lg border-[1px] ${notification.href ? "cursor-pointer" : "cursor-default"} hover:bg-gray-600
        ${notification.status !== NotificationStatus.UNREAD ? "bg-gray-900 text-secondary-content border-border" : "bg-gray-800 text-primary-content"}
      `}
      href={{ pathname: notification.href ?? "#", query: notification.href ? { itemId: notification.itemId } : {} }}
      onClick={
        notification.status === NotificationStatus.UNREAD
          ? () => onNavigate(NotificationStatus.READ, [notification.id])
          : undefined
      }
    >
      {notification.status === NotificationStatus.UNREAD ? (
        <div className={`mr-2 h-3 w-3 rounded-4xl place-self-start mt-[4px] bg-accent`} />
      ) : notification.status === NotificationStatus.DONE ? (
        <div className={`mr-2 h-3 w-3 rounded-4xl place-self-start mt-[4px] bg-success`} />
      ) : (
        <div className={`mr-2 h-3 w-3 rounded-4xl place-self-start mt-[4px] transparent`} />
      )}
      <div onClick={e => e.stopPropagation()} className="place-self-start">
        <Checkbox
          checkStyle={{ width: 20, height: 20 }}
          checked={checked}
          onChange={(_, event) => {
            event.stopPropagation();
            onChange(notification.id);
          }}
        />
      </div>
      <div className="flex-1 ml-2">
        <h4 className="font-semibold mt-[2px]">{notification.title}</h4>
        <p className="text-sm opacity-80">{notification.message}</p>
        <span className="text-xs mt-1 text-gray-400">{createdAt}</span>
      </div>
    </Link>
  );
};

const getActiveViewStatusList = (activeView: string): NotificationStatus[] => {
  switch (activeView) {
    case "inbox":
      return [NotificationStatus.READ, NotificationStatus.UNREAD];
    case "unread":
      return [NotificationStatus.UNREAD];
    case "done":
      return [NotificationStatus.DONE];
    default:
      return [NotificationStatus.UNREAD, NotificationStatus.READ, NotificationStatus.DONE];
  }
};

const NotificationsDashboard = () => {
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [activeView, setActiveView] = useState("inbox");
  const [search, setSearch] = useState("");
  const { showSpinner, hideSpinner } = useGlobalSpinner();

  const { address: userAddress } = useAccount();
  const { unreadCount, refreshUnreadCount } = useGlobalNotifications();

  const { writeContractAsync: changeNotificationStatus } = useScaffoldWriteContract({
    contractName: "NotificationsContract",
  });

  const { handleScroll, fetchPaginatedData, totalItems } = usePagination({
    fetchFunction: fetchNotificationsByUserPaginated,
    itemsPerPage: 15,
    setDataFunction: setLocalNotifications,
    loadingFunction: setLoading,
  });

  useEffect(() => {
    if (!userAddress) {
      return;
    }

    refreshUnreadCount();
  }, [userAddress, refreshUnreadCount]);

  useEffect(() => {
    if (!userAddress) {
      setLocalNotifications([]);
      return;
    }

    fetchPaginatedData(true, activeView, userAddress, getActiveViewStatusList(activeView), search);
    setSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, userAddress, fetchPaginatedData]);

  useEffect(() => {
    if (!userAddress) {
      setLocalNotifications([]);
      return;
    }

    fetchPaginatedData(false, activeView, userAddress, getActiveViewStatusList(activeView), search);
    setSelectedNotifications([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const allSelected = selectedNotifications.length === localNotifications.length && localNotifications.length > 0;

  const handleCheckboxChange = (notificationId: string) => {
    setSelectedNotifications(prevSelected =>
      prevSelected.includes(notificationId)
        ? prevSelected.filter(id => id !== notificationId)
        : [...prevSelected, notificationId],
    );
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(localNotifications.map(n => n.id));
    }
  };

  const changeNotificationsStatus = async (status: NotificationStatus, ids: string[]) => {
    const transactionHash = await changeNotificationStatus({
      functionName: "changeNotificationsStatus",
      args: [ids, status],
    });
    await waitTransaction("notification", transactionHash);
    await refreshUnreadCount();
  };

  const handleSelected = async (status: NotificationStatus) => {
    try {
      showSpinner();
      await changeNotificationsStatus(status, selectedNotifications);

      const updatedLocalNotifications = localNotifications
        .map(n => {
          if (selectedNotifications.includes(n.id)) {
            return { ...n, status };
          }
          return n;
        })
        .filter(notification => getActiveViewStatusList(activeView).includes(notification.status));

      setLocalNotifications(updatedLocalNotifications);
      setSelectedNotifications([]);
    } catch (error) {
      console.error("Failed to change notification status:", error);
    } finally {
      hideSpinner();
    }
  };

  const ActionBar = () => (
    <div className="flex justify-between items-center p-4 border-b border-t border-border">
      <div className="flex items-center space-x-4 ml-4 min-h-[2rem]">
        <label className="flex items-center text-sm text-gray-400 ml-[1.375rem]">
          <Checkbox
            className="place-self-start"
            checkStyle={{ width: 20, height: 20 }}
            checked={allSelected}
            onChange={handleSelectAll}
          />
          <span className="mx-2 whitespace-nowrap text-primary-content font-semibold mt-[0.5px]">Select all</span>
          {selectedNotifications.length > 0 && (
            <span className="text-sm text-secondary-content">
              ({selectedNotifications.length} of {totalItems[activeView]})
            </span>
          )}
        </label>
        {selectedNotifications.length > 0 && (
          <>
            <Button
              icon={<CheckCircleIcon className="h-5 w-5" />}
              onClick={() => handleSelected(NotificationStatus.DONE)}
              size="xs"
              variant="outline"
            >
              Done
            </Button>
            <Button
              icon={<EnvelopeOpenIcon className="h-5 w-5" />}
              onClick={() => handleSelected(NotificationStatus.READ)}
              size="xs"
              variant="outline"
            >
              Mark as read
            </Button>
            <Button
              icon={<EnvelopeIcon className="h-5 w-5" />}
              onClick={() => handleSelected(NotificationStatus.UNREAD)}
              size="xs"
              variant="outline"
            >
              Mark as unread
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-1 w-full h-full overflow-hidden rounded-tl-2xl bg-secondary shadow-xl">
      {/* Sidebar */}
      <div className="w-64 bg-[var(--color-surface)] border-r border-border p-4 flex flex-col space-y-2">
        <h2 className="text-xl font-semibold mb-4 text-white">Notifications</h2>
        <SideBarButton
          isActive={activeView === "inbox"}
          onClick={() => {
            setActiveView("inbox");
          }}
        >
          <InboxIcon className="h-5 w-5" />
          <span>Inbox</span>
        </SideBarButton>
        <SideBarButton
          isActive={activeView === "unread"}
          onClick={() => {
            setActiveView("unread");
          }}
        >
          <ArchiveBoxIcon className="h-5 w-5" />
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="ml-auto bg-gray-800 text-accent font-bold text-xs px-2 py-1 rounded-full">
              {unreadCount}
            </span>
          )}
        </SideBarButton>
        <SideBarButton
          isActive={activeView === "done"}
          onClick={() => {
            setActiveView("done");
          }}
        >
          <CheckCircleIcon className="h-5 w-5" />
          <span>Done</span>
        </SideBarButton>
      </div>

      {/* Main content area */}
      <div className="flex flex-col flex-1">
        {/* Header/Controls */}
        <div className="relative w-[91%] place-self-center mb-[0.3rem]">
          <InputBase
            prefix={<MagnifyingGlassIcon className="h-5 w-5 text-secondary-content" />}
            value={search}
            onChange={v => setSearch(v)}
            variant="outlined"
            type="text"
            placeholder="Search notifications..."
          />
        </div>
        <ActionBar />

        {/* Notifications List */}
        <div
          className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2"
          onScroll={event => handleScroll(event, activeView, userAddress, getActiveViewStatusList(activeView), search)}
        >
          {localNotifications.length > 0
            ? localNotifications.map(notification => (
                <NotificationCard
                  key={notification.id}
                  checked={selectedNotifications.includes(notification.id)}
                  notification={notification}
                  onChange={handleCheckboxChange}
                  onNavigate={changeNotificationsStatus}
                />
              ))
            : !loading && (
                <div className="p-4 text-center text-secondary-content text-xl">No notifications to display.</div>
              )}
          {loading && <Spinner />}
        </div>
      </div>
    </div>
  );
};

export default NotificationsDashboard;
