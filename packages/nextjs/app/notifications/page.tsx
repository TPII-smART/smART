"use client";

import React, { useEffect, useState } from "react";
import { RedirectType, redirect } from "next/navigation";
import { styled } from "@mui/material";
import { NotificationStatus } from "@se-2/common";
import { EnvelopeIcon, EnvelopeOpenIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { ArchiveBoxIcon, CheckCircleIcon, InboxIcon } from "@heroicons/react/24/solid";
import Button from "~~/components/Button";
import Checkbox from "~~/components/CheckBox/CheckBox";
import { InputBase } from "~~/components/scaffold-eth";
import { Notification } from "~~/types/notification.types";

interface NotificationsDashboardProps {
  notifications: Notification[];
}

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

const NotificationsDashboard: React.FC<NotificationsDashboardProps> = ({ notifications }) => {
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>(notifications);
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);
  const [activeView, setActiveView] = useState("inbox");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setLocalNotifications(notifications);
    setSelectedNotifications([]);
  }, [notifications]);

  const filteredNotifications = showUnreadOnly
    ? localNotifications.filter(n => n.status === NotificationStatus.UNREAD)
    : localNotifications;

  const unreadCount = localNotifications.filter(n => n.status === NotificationStatus.UNREAD).length;

  const allFilteredSelected =
    selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0;

  const handleCheckboxChange = (notificationId: string) => {
    setSelectedNotifications(prevSelected =>
      prevSelected.includes(notificationId)
        ? prevSelected.filter(id => id !== notificationId)
        : [...prevSelected, notificationId],
    );
  };

  const handleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedNotifications([]);
    } else {
      const allFilteredIds = filteredNotifications.map(n => n.id);
      setSelectedNotifications(allFilteredIds);
    }
  };

  const handleSelected = (status: NotificationStatus) => {
    console.log(status);
    const updatedNotifications = localNotifications.filter(n => !selectedNotifications.includes(n.id));
    setLocalNotifications(updatedNotifications);
    setSelectedNotifications([]);
  };

  const ActionBar = () => (
    <div className="flex justify-between items-center p-4 border-b border-t border-border">
      <div className="flex items-center space-x-4 ml-4 min-h-[2rem]">
        <label className="flex items-center text-sm text-gray-400 ml-[1.375rem]">
          <Checkbox
            className="place-self-start"
            checkStyle={{ width: 20, height: 20 }}
            checked={allFilteredSelected}
            onChange={handleSelectAll}
          />
          <span className="mx-2 whitespace-nowrap text-primary-content font-semibold mt-[0.5px]">Select all</span>
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

  const NotificationCard = (notification: Notification) => {
    const [createdAt, setCreatedAt] = useState<string>("");

    useEffect(() => {
      setCreatedAt(new Date(notification.createdAt).toLocaleString());
    }, [notification.createdAt]);

    return (
      <div
        key={notification.id}
        className={`
            flex items-center p-4 rounded-lg border-[1px] ${notification.href ? "cursor-pointer" : "cursor-default"} hover:bg-gray-600
            ${notification.status !== NotificationStatus.UNREAD ? "bg-gray-900 text-secondary-content border-border" : "bg-gray-800 text-primary-content"}
        `}
        onClick={() => (notification.href ? redirect(notification.href, RedirectType.push) : undefined)}
      >
        <div
          className={`mr-2 h-3 w-3 rounded-4xl place-self-start mt-[4px] ${notification.status === NotificationStatus.UNREAD ? "bg-accent" : "transparent"}`}
        />
        <Checkbox
          className="place-self-start"
          checkStyle={{ width: 20, height: 20 }}
          checked={selectedNotifications.includes(notification.id)}
          onChange={() => handleCheckboxChange(notification.id)}
        />
        <div className="flex-1 ml-2">
          <h4 className="font-semibold mt-[2px]">{notification.title}</h4>
          <p className="text-sm opacity-80">{notification.message}</p>
          <span className="text-xs mt-1 text-gray-400">{createdAt}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-1 w-full h-full overflow-hidden rounded-tl-2xl bg-secondary shadow-xl">
      {/* Sidebar */}
      <div className="w-64 bg-[var(--color-surface)] border-r border-border p-4 flex flex-col space-y-2">
        <h2 className="text-xl font-semibold mb-4 text-white">Notifications</h2>
        <SideBarButton
          isActive={activeView === "inbox"}
          onClick={() => {
            setActiveView("inbox");
            setShowUnreadOnly(false);
          }}
        >
          <InboxIcon className="h-5 w-5" />
          <span>Inbox</span>
        </SideBarButton>
        <SideBarButton
          isActive={activeView === "unread"}
          onClick={() => {
            setActiveView("unread");
            setShowUnreadOnly(true);
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
            setShowUnreadOnly(false);
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
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => <NotificationCard key={notification.id} {...notification} />)
          ) : (
            <div className="p-4 text-center text-secondary-content text-xl">No notifications to display.</div>
          )}
        </div>
      </div>
    </div>
  );
};

// Main App component
const Notifications = () => {
  const notificationsData = [
    {
      id: "1",
      user: "0x123...",
      title: "New Job Offer",
      message: "You have a new job offer for a web development project.",
      href: "#",
      createdAt: new Date().toISOString(),
      status: NotificationStatus.UNREAD,
    },
    {
      id: "2",
      user: "0x456...",
      title: "Profile Updated",
      message: "Your profile has been successfully updated.",
      createdAt: new Date().toISOString(),
      status: NotificationStatus.READ,
    },
    {
      id: "3",
      user: "0xabc...",
      title: "New Message",
      message: "You have a new message from a client.",
      href: "#",
      createdAt: new Date().toISOString(),
      status: NotificationStatus.DONE,
    },
    {
      id: "4",
      user: "0xdef...",
      title: "New Follower",
      message: "A new user started following you.",
      createdAt: new Date().toISOString(),
      status: NotificationStatus.UNREAD,
    },
    {
      id: "5",
      user: "0xghi...",
      title: "Project Update",
      message: "Your project milestone has been reviewed.",
      href: "#",
      createdAt: new Date().toISOString(),
      status: NotificationStatus.UNREAD,
    },
  ];

  return <NotificationsDashboard notifications={notificationsData as any} />;
};

export default Notifications;
