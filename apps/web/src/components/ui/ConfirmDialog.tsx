import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  lockDuration?: number;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  lockDuration = 5,
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  const [countdown, setCountdown] = useState(lockDuration);
  const [locked, setLocked] = useState(true);

  useEffect(() => {
    if (!open) {
      setCountdown(lockDuration);
      setLocked(true);
      return;
    }

    setCountdown(lockDuration);
    setLocked(true);

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, lockDuration]);

  const handleConfirm = useCallback(() => {
    if (!locked) {
      onConfirm();
    }
  }, [locked, onConfirm]);

  if (!open) return null;

  const variantStyles = variant === 'danger'
    ? 'border-danger/40 bg-[#1C1215]'
    : 'border-warning/40 bg-[#1C1A12]';

  const iconColor = variant === 'danger' ? 'text-danger' : 'text-warning';

  const buttonVariant = variant === 'danger' ? 'danger' : 'ghost';

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={onCancel}>
      <div
        className={`bg-bg-secondary rounded-2xl border p-6 max-w-md w-full ${variantStyles}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${variant === 'danger' ? 'bg-danger/20' : 'bg-warning/20'}`}>
            <AlertTriangle className={`w-5 h-5 ${iconColor}`} strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <p className="text-sm text-text-secondary mt-1">{message}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="subtle" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            variant={buttonVariant}
            size="sm"
            onClick={handleConfirm}
            disabled={locked}
            className={locked ? 'opacity-50 cursor-not-allowed' : ''}
          >
            {locked ? `Aguarde ${countdown}s...` : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
