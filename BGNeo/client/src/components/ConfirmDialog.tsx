import { useState, useEffect } from 'react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message,
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
  onConfirm, onCancel
}: ConfirmDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setTimeout(() => setVisible(false), 200);
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open && !visible) return null;

  return (
    <div className={`confirm-overlay ${open ? '' : 'closing'}`}>
      <div className={`confirm-dialog ${open ? '' : 'dialog-exit'}`}>
        <h3 className="confirm-title">{title}</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button onClick={onCancel} className="btn-confirm-cancel">{cancelText}</button>
          <button
            onClick={onConfirm}
            className={`btn-confirm-ok ${danger ? 'danger' : ''}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
