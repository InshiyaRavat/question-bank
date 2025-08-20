"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

const ToastContext = createContext();

const toastTypes = {
  success: {
    icon: CheckCircle,
    className: "bg-green-50 border-green-200 text-green-800",
    iconClassName: "text-green-600",
  },
  error: {
    icon: AlertCircle,
    className: "bg-red-50 border-red-200 text-red-800",
    iconClassName: "text-red-600",
  },
  warning: {
    icon: AlertTriangle,
    className: "bg-yellow-50 border-yellow-200 text-yellow-800",
    iconClassName: "text-yellow-600",
  },
  info: {
    icon: Info,
    className: "bg-blue-50 border-blue-200 text-blue-800",
    iconClassName: "text-blue-600",
  },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((toast) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = {
      id,
      type: "info",
      duration: 5000,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, newToast.duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => {
          const config = toastTypes[toast.type];
          const Icon = config.icon;

          return (
            <div
              key={toast.id}
              className={`min-w-72 max-w-96 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full ${config.className}`}
            >
              <div className="flex items-start gap-3">
                <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.iconClassName}`} />
                <div className="flex-1">
                  {toast.title && <div className="font-medium mb-1">{toast.title}</div>}
                  {toast.description && <div className="text-sm opacity-90">{toast.description}</div>}
                </div>
                <button onClick={() => removeToast(toast.id)} className="p-0.5 hover:bg-black/10 rounded">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  const { addToast } = context;

  const toast = useCallback(
    (options) => {
      if (typeof options === "string") {
        return addToast({ description: options });
      }
      return addToast(options);
    },
    [addToast]
  );

  return { toast };
}
