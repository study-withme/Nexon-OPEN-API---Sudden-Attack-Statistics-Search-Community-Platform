"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { clsx } from "clsx";
import { subscribeToast } from "@/lib/toast";

type Toast = {
  id: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
};

type ToastContextValue = {
  toasts: Toast[];
  push: (toast: Omit<Toast, "id">) => void;
  remove: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast: Omit<Toast, "id">) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => remove(id), 3200);
  }, [remove]);

  const value = useMemo(() => ({ toasts, push, remove }), [toasts, push, remove]);

  useEffect(() => {
    const unsubscribe = subscribeToast((toast) => push(toast));
    return () => {
      unsubscribe();
    };
  }, [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={clsx(
              "w-full max-w-md rounded-xl border px-4 py-3 text-sm shadow-lg backdrop-blur",
              toast.type === "success" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-100",
              toast.type === "error" && "border-red-500/40 bg-red-500/10 text-red-100",
              toast.type === "warning" && "border-amber-400/60 bg-amber-500/10 text-amber-100",
              (!toast.type || toast.type === "info") &&
                "border-slate-700 bg-slate-900/80 text-slate-100"
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}

