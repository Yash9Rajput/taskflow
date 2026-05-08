import React from 'react';

export default function ConfirmModal({ title, message, confirmLabel='Delete', danger=true, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onCancel()}>
      <div className="modal-box" style={{maxWidth:420,textAlign:'center'}}>
        <div style={{fontSize:48,marginBottom:'1rem'}}>{danger?'🗑️':'⚠️'}</div>
        <h3 style={{fontFamily:'var(--font-d)',fontSize:18,fontWeight:700,marginBottom:'0.75rem'}}>{title}</h3>
        <p style={{fontSize:14,color:'var(--text-2)',lineHeight:1.6,marginBottom:'1.5rem'}}>{message}</p>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button className="btn" style={{minWidth:100}} onClick={onCancel}>No, cancel</button>
          <button className={`btn ${danger?'btn-danger':'btn-primary'}`} style={{minWidth:100}} onClick={onConfirm}>
            Yes, {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
