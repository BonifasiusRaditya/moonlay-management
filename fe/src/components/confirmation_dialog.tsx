import * as Dialog from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import '../css/confirmation_dialog.css';
import { Button } from './button';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  children?: ReactNode;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'info',
  isLoading = false,
  children,
}: ConfirmationDialogProps) {
  const handleConfirm = () => {
    if (!isLoading) {
      onConfirm();
    }
  };

  const variantStyles = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    info: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content p-6" style={{ backgroundColor: '#F2F6F4' }}>
          <Dialog.Title className="text-xl font-bold mb-2" style={{ color: '#217462' }}>{title}</Dialog.Title>
          <Dialog.Description className="mb-6" style={{ color: '#1a5a4d' }}>{description}</Dialog.Description>
          {children && <div className="mb-4">{children}</div>}
          <div className="flex gap-3 justify-end">
            <Dialog.Close asChild>
              <Button variant="secondary" type="button" disabled={isLoading}>
                {cancelLabel}
              </Button>
            </Dialog.Close>
            <Button
              variant={variant === 'danger' ? 'danger' : 'primary'}
              onClick={handleConfirm}
              className={variant === 'warning' ? variantStyles.warning : ''}
              isLoading={isLoading}
              disabled={isLoading}
            >
              {confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

