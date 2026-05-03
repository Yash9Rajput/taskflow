import React from 'react';

/* ── Badge ── */
export function Badge({ status, priority, role }) {
  if (role) {
    const cls = role === 'admin' ? 'badge-admin' : 'badge-member';
    return <span className={`badge ${cls}`}>{role}</span>;
  }
  if (priority) {
    const cls = { high: 'tag-high', medium: 'tag-medium', low: 'tag-low' }[priority] || '';
    return <span className={`tag-priority ${cls}`}>{priority}</span>;
  }
  const map = {
    todo:        { cls: 'badge-todo',     label: 'To do' },
    'in-progress':{ cls: 'badge-progress', label: 'In Progress' },
    done:        { cls: 'badge-done',     label: 'Done' },
    overdue:     { cls: 'badge-overdue',  label: 'Overdue' },
  };
  const s = map[status] || { cls: '', label: status };
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

/* ── Avatar ── */
const COLORS = [
  ['#B5D4F4','#0C447C'],['#C0DD97','#3B6D11'],['#F4C0D1','#993556'],
  ['#FAC775','#633806'],['#CED0F6','#3C3489'],['#9FE1CB','#085041'],
];
const colorCache = {};
function getColor(id = '') {
  if (!colorCache[id]) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % COLORS.length;
    colorCache[id] = COLORS[Math.abs(h) % COLORS.length];
  }
  return colorCache[id];
}
export function Avatar({ user, size = 32 }) {
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  const [bg, text] = getColor(user?.id || '');
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: text,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 500, flexShrink: 0,
    }}>{initials}</div>
  );
}

/* ── ProgressBar ── */
export function ProgressBar({ value, max }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 4, height: 6, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: '#378ADD', borderRadius: 4, transition: 'width 0.3s' }} />
    </div>
  );
}

/* ── StatCard ── */
export function StatCard({ label, value, color }) {
  return (
    <div style={{ background: 'var(--color-background-secondary)', borderRadius: 'var(--border-radius-md)', padding: '1rem', textAlign: 'center' }}>
      <div style={{ fontSize: 28, fontWeight: 500, color: color || 'var(--color-text-primary)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

/* ── Modal ── */
export function Modal({ title, onClose, children, width = 440 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--color-background-primary)',
        border: '0.5px solid var(--color-border-secondary)',
        borderRadius: 'var(--border-radius-lg)', padding: '1.5rem',
        width, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ fontSize: 15, fontWeight: 500, marginBottom: '1rem' }}>{title}</div>
        {children}
      </div>
    </div>
  );
}

/* ── FormField ── */
export function Field({ label, children, error }) {
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <label style={{ fontSize: 12, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>{label}</label>}
      {children}
      {error && <div style={{ color: 'var(--color-text-danger)', fontSize: 12, marginTop: 4 }}>{error}</div>}
    </div>
  );
}

/* ── Button ── */
export function Button({ children, variant = 'default', size = 'md', onClick, disabled, style = {} }) {
  const base = {
    padding: size === 'sm' ? '4px 10px' : '7px 14px',
    fontSize: size === 'sm' ? 12 : 13,
    borderRadius: 'var(--border-radius-md)',
    border: '0.5px solid var(--color-border-secondary)',
    background: 'var(--color-background-primary)',
    color: 'var(--color-text-primary)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'var(--font-sans)',
    transition: 'background 0.15s',
    ...style,
  };
  if (variant === 'primary') { base.background = '#185FA5'; base.color = '#E6F1FB'; base.borderColor = '#185FA5'; }
  if (variant === 'danger')  { base.background = 'var(--color-background-danger)'; base.color = 'var(--color-text-danger)'; base.borderColor = 'var(--color-border-danger)'; }
  return <button style={base} onClick={onClick} disabled={disabled}>{children}</button>;
}

/* ── Spinner ── */
export function Spinner() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <div style={{ width: 24, height: 24, border: '2px solid var(--color-border-secondary)', borderTopColor: '#185FA5', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Empty ── */
export function Empty({ message = 'Nothing here yet.' }) {
  return <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, textAlign: 'center', padding: '2rem' }}>{message}</div>;
}

/* ── isOverdue helper ── */
export function isOverdue(task) {
  return task.status !== 'done' && task.due_date && new Date(task.due_date) < new Date();
}

export function taskStatusDisplay(task) {
  return isOverdue(task) ? 'overdue' : task.status;
}
