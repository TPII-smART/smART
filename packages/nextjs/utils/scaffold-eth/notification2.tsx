import React from "react";
import { Toast, ToastPosition, toast } from "react-hot-toast";

// --- Iconos SVG para cada tipo de notificación ---
// Usamos SVG en línea para mantener todo en un solo archivo y para un rendimiento óptimo.

const SuccessIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ErrorIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const InfoIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const WarningIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);

const CloseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// --- Mapeo de tipos a colores e iconos ---
const NOTIFICATION_CONFIG = {
  success: {
    icon: <SuccessIcon />,
    colorClass: "text-green-500",
  },
  error: {
    icon: <ErrorIcon />,
    colorClass: "text-red-500",
  },
  info: {
    icon: <InfoIcon />,
    colorClass: "text-blue-400",
  },
  warning: {
    icon: <WarningIcon />,
    colorClass: "text-yellow-500",
  },
};

// --- Tipos de TypeScript ---
type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationProps {
  content?: React.ReactNode | NotificationMessage;
  type: NotificationType;
}

export interface NotificationMessage {
  title: string;
  description?: string;
}

// --- Componente de Notificación Personalizado ---
const CustomNotification: React.FC<NotificationProps> = ({ type, content }) => {
  const { icon, colorClass } = NOTIFICATION_CONFIG[type];

  return (
    <div className="flex items-start w-full max-w-sm">
      <div className={`flex-shrink-0 ${colorClass}`}>{icon}</div>
      <div className="ml-3 flex-1 pt-0.5">
        {(content as any)?.title === undefined ? (
          (content as React.ReactNode)
        ) : (
          <>
            <span className="text-sm font-semibold text-gray-100">{(content as any).title}</span>
            {(content as any)?.description && (
              <span className="mt-1 text-sm text-gray-400">{(content as any)?.description}</span>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export type NotificationArgs = NotificationProps & {
  duration?: number;
  position?: ToastPosition;
};

export const showNotification = ({ duration = 5000, position, ...args }: NotificationArgs) => {
  toast.custom(
    (t: Toast) => (
      <div
        onClick={() => toast.dismiss(t.id)}
        className={`relative w-96 bg-zinc-800 border border-zinc-700 shadow-xl rounded-lg p-4 flex items-start transition-all duration-300 cursor-pointer ${
          t.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <CustomNotification {...args} />
        <button
          onClick={e => {
            e.stopPropagation();
            toast.dismiss(t.id);
          }}
          className="absolute top-3 right-3 text-gray-500 hover:text-white transition-colors"
        >
          <CloseIcon />
        </button>
        {/* Contenedor de la barra de progreso */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-zinc-700/50 rounded-b-lg overflow-hidden">
          {/* La barra animada */}
          <div className="h-full bg-[#D97706]" style={{ animation: `progress ${t.duration}ms linear forwards` }} />
        </div>
      </div>
    ),
    { id: `${args.type}-${(args.content as any)?.title ?? ""}-${Math.random()}`, duration, position },
  );
};
