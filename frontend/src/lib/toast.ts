type ToastPayload = {
  message: string;
  type?: "success" | "error" | "info" | "warning";
};

const listeners = new Set<(toast: ToastPayload) => void>();

export function subscribeToast(listener: (toast: ToastPayload) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitToast(toast: ToastPayload) {
  listeners.forEach((listener) => listener(toast));
}
