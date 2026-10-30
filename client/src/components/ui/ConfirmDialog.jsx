import { Modal } from './Modal.jsx'
import { Button } from './Button.jsx'

export function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmTone = 'danger',
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      kicker="Confirmation"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            variant={confirmTone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <p style={{ margin: 0, color: 'var(--text)', fontSize: 'var(--fs-md)', lineHeight: 'var(--lh)' }}>
        {message}
      </p>
    </Modal>
  )
}
export default ConfirmDialog
