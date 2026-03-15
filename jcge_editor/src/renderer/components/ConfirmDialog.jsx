import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return (
    <Modal title={title || 'Confirm'} onClose={onCancel}>
      <p style={{ margin: '12px 0', color: 'var(--text-secondary)' }}>{message}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn btn-sm btn-danger" onClick={onConfirm}>Delete</button>
      </div>
    </Modal>
  );
}
