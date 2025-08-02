import React, { ReactNode, createContext, useContext, useState } from "react";
import { Spinner } from "@/components/Spinner/Spinner";

type SpinnerType = {
  loading: boolean;
};

type SpinnerContextType = {
  showSpinner: () => void;
  hideSpinner: () => void;
};

const SpinnerContext = createContext<SpinnerContextType | undefined>(undefined);

export const SpinnerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const TIMER_DELAY = 100; // Delay in milliseconds before showing the spinner

  const [spinner, setSpinner] = useState<SpinnerType>({ loading: false });
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const showSpinner = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSpinner({ loading: true });
      timerRef.current = null;
    }, TIMER_DELAY);
  };

  const hideSpinner = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSpinner({ loading: false });
  };

  return (
    <SpinnerContext.Provider value={{ showSpinner, hideSpinner }}>
      {spinner.loading && (
        <>
          <style>
            {`
              body {
                overflow: hidden
              }
            `}
          </style>
          <Spinner variant="global" size={200} />
        </>
      )}
      {children}
    </SpinnerContext.Provider>
  );
};

export const useGlobalSpinner = () => {
  const context = useContext(SpinnerContext);
  if (!context) throw new Error("useGlobalSpinner must be used within SpinnerProvider");
  return context;
};
