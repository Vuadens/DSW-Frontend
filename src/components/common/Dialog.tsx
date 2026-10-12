import { useEffect, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  variant?: 'drawer' | 'modal';
  extraClass?: string;
  label: string;
  children: ReactNode;
}

/** Diálogo nativo: maneja foco, Escape y capa modal sin dependencias adicionales. */
export function Dialog({ open, onClose, variant = 'drawer', extraClass = '', label, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`${variant} ${extraClass}`.trim()}
      aria-label={label}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
    >
      {open && <div className="in">{children}</div>}
    </dialog>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Eliminar', onCancel, onConfirm }: ConfirmProps) {
  return (
    <Dialog open={open} onClose={onCancel} variant="modal" label={title}>
      <h2>{title}</h2>
      <p className="lede" style={{ marginTop: 0 }}>
        {message}
      </p>
      <div className="acts">
        <button type="button" className="btn line sm" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="btn sm" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
