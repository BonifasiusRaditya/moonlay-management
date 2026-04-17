import * as Dialog from '@radix-ui/react-dialog';
import '../css/modal.css';

interface ModalProps {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  className?: string;
}

export function Modal({ children, open, onOpenChange, title, className }: ModalProps) {
  const contentClassName = className ? `max-w-2xl modal-panel ${className}` : 'max-w-2xl modal-panel';

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className={contentClassName}>
          <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-6 py-4">
            {title && (
              <Dialog.Title className="text-xl font-bold text-[#217462]">
                {title}
              </Dialog.Title>
            )}
            <Dialog.Close
              className="rounded-full p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              type="button"
            >
              ×
            </Dialog.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

