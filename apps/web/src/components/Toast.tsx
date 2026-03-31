'use client';

import type { ToastItem, ToastVariant } from '../hooks/useToast';

function variantIcon(variant: ToastVariant): string {
  const icons: Record<ToastVariant, string> = {
    success: '✓',
    danger: '✕',
    warning: '⚠',
    info: 'ℹ',
  };
  return icons[variant];
}

interface SingleToastProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

function SingleToast({ item, onDismiss }: SingleToastProps) {
  return (
    <div className={`toast toast--${item.variant}`} role="alert" aria-live="assertive">
      <span className="toast__icon" aria-hidden="true">
        {variantIcon(item.variant)}
      </span>
      <span style={{ flex: 1 }}>{item.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(item.id)}
        aria-label="Dismiss notification"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          opacity: 0.7,
          fontSize: '1.1rem',
          lineHeight: 1,
          padding: '0 0 0 var(--space-2)',
        }}
      >
        ×
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <SingleToast key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
