import React from "react";
import styles from "./Notification.module.css";
import { Toast, ToastPosition, toast } from "react-hot-toast";
import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const NOTIFICATION_CONFIG = {
  success: {
    icon: <CheckCircleIcon className="h-6 w-6 text-green-500" />,
    colorClass: "text-green-500",
  },
  error: {
    icon: <XCircleIcon className="h-6 w-6 text-red-500" />,
    colorClass: "text-red-500",
  },
  info: {
    icon: <ExclamationCircleIcon className="h-6 w-6 text-blue-400" />,
    colorClass: "text-blue-400",
  },
  warning: {
    icon: <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />,
    colorClass: "text-yellow-500",
  },
  loading: {
    icon: <ArrowPathIcon className="h-6 w-6 text-accent" />,
    colorClass: "text-gray-500",
  },
};

type NotificationType = "success" | "error" | "info" | "warning" | "loading";

interface NotificationProps {
  content?: React.ReactNode | NotificationMessage;
  type: NotificationType;
}

export interface NotificationMessage {
  title: string;
  description?: string;
}

const CustomNotification: React.FC<NotificationProps> = ({ type, content }) => {
  const { icon, colorClass } = NOTIFICATION_CONFIG[type];

  return (
    <div className="flex items-start w-full max-w-sm">
      <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
      <div className="ml-2">
        {(content as any)?.title === undefined ? (
          (content as React.ReactNode)
        ) : (
          <div className="ml-1 mr-6 flex-1 flex flex-col">
            <span className="text-md text-primary-content">{(content as any).title}</span>
            {(content as any)?.description && (
              <span className="mt-1 text-sm text-primary-content text-justify">{(content as any)?.description}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export type NotificationArgs = NotificationProps & {
  duration?: number;
  position?: ToastPosition;
};

export const Notification = ({ duration = 5000, position = "top-center", ...args }: NotificationArgs) => {
  return toast.custom(
    (t: Toast) => (
      <div
        onClick={() => toast.dismiss(t.id)}
        className={`relative w-96 bg-[var(--color-surface)] border border-border shadow-xl rounded-lg p-4 flex items-start transition-all duration-300 cursor-pointer ${
          t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <CustomNotification {...args} />
        <button
          onClick={e => {
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
          className="absolute top-3 right-3 text-primary-content hover:text-accent transition-colors"
        >
          <XMarkIcon className="h-6 w-6 text-primary-content" />
        </button>
        {/* Contenedor de la barra de progreso */}
        <div
          className={`
            absolute bottom-0 left-0 w-full h-1 
            bg-secondary rounded-b-lg overflow-hidden 
            border-b border-r border-l border-border
          `}
        >
          {/* La barra animada */}
          <div
            className="h-full bg-accent"
            style={{ animation: `${styles.progress} ${t.duration}ms linear forwards` }}
          />
        </div>
      </div>
    ),
    { duration, position },
  );
};

interface NotificationOptions {
  duration?: number;
  position?: ToastPosition;
}

type NotificationContent = React.ReactNode | NotificationMessage;

export const notification = {
  success: (content: NotificationContent, options?: NotificationOptions) => {
    return Notification({ type: "success", content, duration: options?.duration, position: options?.position });
  },
  info: (content: NotificationContent, options?: NotificationOptions) => {
    return Notification({ type: "info", content, duration: options?.duration, position: options?.position });
  },
  warning: (content: NotificationContent, options?: NotificationOptions) => {
    return Notification({ type: "warning", content, duration: options?.duration, position: options?.position });
  },
  error: (content: NotificationContent, options?: NotificationOptions) => {
    return Notification({ type: "error", content, duration: options?.duration, position: options?.position });
  },
  loading: (content: NotificationContent, options?: NotificationOptions) => {
    return Notification({ type: "loading", content, duration: options?.duration, position: options?.position });
  },
  remove: (toastId: string) => {
    toast.remove(toastId);
  },
};
