import { useCallback, useState } from "react";
import type { ConfirmDialogProps, ConfirmDialogVariant } from "../components/ui/ConfirmDialog";

export type ConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
};

type Pending = {
  options: ConfirmOptions;
  action?: () => void | Promise<void>;
  resolve?: (value: boolean) => void;
};

export function useConfirmDialog() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [loading, setLoading] = useState(false);

  /** Opens dialog; resolves true when user confirms, false on cancel. */
  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ options, resolve });
    });
  }, []);

  /** Opens dialog and runs action on confirm (shows loading until action finishes). */
  const confirmAction = useCallback(
    (options: ConfirmOptions, action: () => void | Promise<void>) => {
      setPending({ options, action });
    },
    [],
  );

  const handleCancel = useCallback(() => {
    if (loading) return;
    pending?.resolve?.(false);
    setPending(null);
    setLoading(false);
  }, [pending, loading]);

  const handleConfirm = useCallback(async () => {
    if (!pending || loading) return;
    if (pending.action) {
      setLoading(true);
      try {
        await pending.action();
        setPending(null);
      } finally {
        setLoading(false);
      }
      return;
    }
    pending.resolve?.(true);
    setPending(null);
  }, [pending, loading]);

  const dialogProps: ConfirmDialogProps = {
    open: pending != null,
    title: pending?.options.title,
    message: pending?.options.message ?? "",
    confirmLabel: pending?.options.confirmLabel,
    cancelLabel: pending?.options.cancelLabel ?? "Cancel",
    variant: pending?.options.variant,
    loading,
    onConfirm: () => void handleConfirm(),
    onCancel: handleCancel,
  };

  return { confirm, confirmAction, dialogProps };
}
