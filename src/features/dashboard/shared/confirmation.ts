"use client";

export type ConfirmationOptions = {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export function createConfirmationController() {
  type Request = {
    id: number;
    message: string;
    options: ConfirmationOptions;
    open: boolean;
    opener: HTMLElement | null;
    answer: boolean;
    resolve: (answer: boolean) => void;
  };
  let current: Request | null = null;
  let hosts = 0;
  let nextId = 0;
  const listeners = new Set<() => void>();
  const notify = () => {
    for (const listener of listeners) listener();
  };
  const cancel = () => {
    const request = current;
    current = null;
    notify();
    request?.resolve(false);
  };
  return {
    getSnapshot: () => current,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    mount() {
      hosts++;
      return () => {
        hosts--;
        if (!hosts) cancel();
      };
    },
    request(
      message: string,
      options: ConfirmationOptions = {},
    ): Promise<boolean> {
      if (!hosts || current) return Promise.resolve(false);
      return new Promise((resolve) => {
        current = {
          id: ++nextId,
          message,
          options,
          open: true,
          answer: false,
          resolve,
          opener:
            typeof document !== "undefined" &&
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null,
        };
        notify();
      });
    },
    close(answer: boolean) {
      if (!current?.open) return;
      current = { ...current, open: false, answer };
      notify();
    },
    finish() {
      if (!current || current.open) return;
      const request = current;
      current = null;
      notify();
      request.resolve(request.answer);
    },
    cancel,
  };
}

export const confirmationController = createConfirmationController();
export const confirmAction = (message: string, options?: ConfirmationOptions) =>
  confirmationController.request(message, options);
