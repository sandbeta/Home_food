import Dialog from './Dialog.jsx'

export default function ConfirmDialog({
  open, title, note, confirmText = '确定', cancelText = '先不要', danger = false, onConfirm, onCancel,
}) {
  return (
    <Dialog open={open} onClose={onCancel} labelledBy="confirm-title">
      <h2 id="confirm-title" className="t-h2" style={{ marginBottom: 'var(--s2)' }}>{title}</h2>
      {note ? <p className="t-note" style={{ marginBottom: 'var(--s5)' }}>{note}</p> : null}
      <div className="dialog__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel}>{cancelText}</button>
        <button type="button" className={`btn ${danger ? 'btn--danger' : 'btn--primary'}`} onClick={onConfirm}>{confirmText}</button>
      </div>
    </Dialog>
  )
}
