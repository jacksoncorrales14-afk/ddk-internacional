"use client";

import { useEffect, useState } from "react";

export interface ToastData {
  message: string;
  type: "success" | "error" | "info";
}

const typeStyles = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
};

export default function Toast({ toast, onDismiss }: { toast: ToastData | null; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toast) {
      // Trigger fade-in
      requestAnimationFrame(() => setVisible(true));
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300); // wait for fade-out
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] max-w-sm rounded-lg px-4 py-3 shadow-lg transition-opacity duration-300 ${
        typeStyles[toast.type]
      } ${visible ? "opacity-100" : "opacity-0"}`}
      role="alert"
    >
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
}
