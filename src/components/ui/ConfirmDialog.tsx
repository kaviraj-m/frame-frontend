import { useEffect, useId, useRef } from "react";
import { cn } from "../../lib/cn";

export type ConfirmDialogVariant = "danger" | "default";

export type ConfirmDialogProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmDialogVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const descId = useId();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6"
      role="presentation"
      onClick={onCancel}
    >
      <div
        className="absolute inset-0 bg-[#080706]/75 backdrop-blur-[2px]"
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className={cn(
          "relative w-full max-w-md rounded-[var(--radius-lg)] border shadow-[var(--shadow-md)]",
          "border-[var(--border-strong)] bg-[var(--surface)]",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex gap-4 p-5 sm:p-6">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
              isDanger
                ? "bg-[var(--danger-muted)] text-[var(--danger)]"
                : "bg-[var(--accent-soft)] text-[var(--accent)]",
            )}
            aria-hidden
          >
            {isDanger ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 11v6M14 11v6" strokeLinecap="round" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v4M12 16h.01" strokeLinecap="round" />
              </svg>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-0.5">
            <h2
              id={titleId}
              className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-[var(--text)]"
            >
              {title}
            </h2>
            <p id={descId} className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              {message}
            </p>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[var(--border)] px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-medium",
              "border border-[var(--border-strong)] bg-[var(--surface-2)] text-[var(--text)]",
              "transition-colors hover:bg-[var(--bg-elevated)]",
              "disabled:pointer-events-none disabled:opacity-50",
            )}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={cn(
              "inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-semibold",
              "transition-colors disabled:pointer-events-none disabled:opacity-50",
              isDanger
                ? "bg-[var(--danger)] text-white hover:brightness-110"
                : "bg-[var(--accent)] text-[#1a1408] hover:brightness-105",
            )}
          >
            {loading ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
