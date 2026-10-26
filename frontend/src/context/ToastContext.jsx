import React, { createContext, useCallback, useContext, useState } from "react";
import { CheckCircleIcon, AlertIcon } from "../components/icons";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, { tone = "success", duration = 3500 } = {}) => {
      const id = Date.now() + Math.random();
      setToasts((list) => [...list, { id, message, tone }]);
      if (duration) setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="cm-toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`cm-toast cm-toast--${t.tone}`}>
            {t.tone === "error" ? <AlertIcon size={16} /> : <CheckCircleIcon size={16} />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
