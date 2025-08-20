"use client";
import { useState, useCallback } from "react";

let toastQueue = [];
let listeners = [];

const addToast = (toast) => {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast = { ...toast, id };

  toastQueue.push(newToast);
  listeners.forEach((listener) => listener([...toastQueue]));

  // Auto-remove toast after 5 seconds unless it's persistent
  if (!toast.persistent) {
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 5000);
  }

  return id;
};

const removeToast = (id) => {
  toastQueue = toastQueue.filter((toast) => toast.id !== id);
  listeners.forEach((listener) => listener([...toastQueue]));
};

export const useToast = () => {
  const [toasts, setToasts] = useState(toastQueue);

  const subscribe = useCallback((callback) => {
    listeners.push(callback);
    return () => {
      listeners = listeners.filter((listener) => listener !== callback);
    };
  }, []);

  const toast = useCallback((options) => {
    return addToast(options);
  }, []);

  const dismiss = useCallback((id) => {
    removeToast(id);
  }, []);

  // Subscribe to toast updates
  useState(() => {
    const unsubscribe = subscribe(setToasts);
    return unsubscribe;
  });

  return {
    toast,
    dismiss,
    toasts,
  };
};
