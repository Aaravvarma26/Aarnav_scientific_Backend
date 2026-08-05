"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";
import { cn } from "@/common/utils";

type Toast = { id: number; message: string; type: "success" | "error" };
const ToastContext = createContext<{ push: (message: string, type?: "success" | "error") => void } | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-6 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-premium",
              t.type === "success" ? "bg-navy-900" : "bg-red-600"
            )}
          >
            {t.type === "success" ? <CheckCircle2 className="h-4 w-4 text-teal-400" /> : <XCircle className="h-4 w-4" />}
            {t.message}
            <button onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}>
              <X className="h-3.5 w-3.5 opacity-70" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
