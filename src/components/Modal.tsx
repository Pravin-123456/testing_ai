import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icon';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  labelledBy: string;
  describedBy?: string;
  className?: string;
  backdropClassName?: string;
  closeLabel?: string;
  initialFocus?: 'first' | 'none';
}

export function Modal({
  children,
  onClose,
  labelledBy,
  describedBy,
  className = '',
  backdropClassName = '',
  closeLabel = 'Close dialog',
  initialFocus = 'first',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    if (initialFocus !== 'none') {
      requestAnimationFrame(() => {
        const target = dialog?.querySelector<HTMLElement>('[data-modal-autofocus]:not([disabled])') ??
          dialog?.querySelector<HTMLElement>('input:not([disabled]), button:not([disabled]):not(.modal-close), a[href], [tabindex]:not([tabindex="-1"])') ??
          dialog;
        target?.focus();
      });
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'input:not([disabled]), button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute('aria-hidden'));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previous?.focus();
    };
  }, [initialFocus, onClose]);

  return (
    <div
      className={`modal-backdrop ${backdropClassName}`.trim()}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`modal-dialog ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
      >
        <button className="modal-close icon-button" type="button" onClick={onClose} aria-label={closeLabel}>
          <Icon name="close" size={19} />
        </button>
        {children}
      </div>
    </div>
  );
}
