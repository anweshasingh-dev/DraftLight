import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.css';

function ConfirmDialog({ isOpen, projectTitle, isBusy = false, onCancel, onConfirm }) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    cancelButtonRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape') onCancel();
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <header className="confirm-dialog-titlebar">
          <AlertTriangle size={14} aria-hidden="true" />
          Confirm deletion
        </header>
        <div className="confirm-dialog-body">
          <h2 id="delete-dialog-title">Delete “{projectTitle}”?</h2>
          <p id="delete-dialog-description">
            This removes the draft from the local SQLite database. This action cannot be undone.
          </p>
          <div className="confirm-dialog-actions">
            <button ref={cancelButtonRef} type="button" onClick={onCancel} disabled={isBusy}>
              Keep project
            </button>
            <button
              className="delete-confirm-button"
              type="button"
              onClick={onConfirm}
              disabled={isBusy}
            >
              {isBusy ? 'Deleting…' : 'Delete project'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
