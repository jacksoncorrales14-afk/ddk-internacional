"use client";

import { SessionProvider } from "next-auth/react";
import { SWRConfig } from "swr";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import { createContext, useContext } from "react";

type ShowToastFn = (message: string, type: "success" | "error" | "info") => void;
const ToastContext = createContext<ShowToastFn>(() => {});

export function useGlobalToast() {
  return useContext(ToastContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const { toast, showToast, dismissToast } = useToast();

  return (
    <SessionProvider>
      <SWRConfig
        value={{
          dedupingInterval: 60000, // 1 min – don't refetch the same key within this window
          focusThrottleInterval: 300000, // 5 min – don't refetch on tab focus within this window
        }}
      >
        <ToastContext.Provider value={showToast}>
          {children}
          <Toast toast={toast} onDismiss={dismissToast} />
        </ToastContext.Provider>
      </SWRConfig>
    </SessionProvider>
  );
}
