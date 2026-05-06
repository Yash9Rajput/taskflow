import React from 'react';

export function Spinner() {
  return <div className="spinner" />;
}

export function Empty({ message = 'Nothing here yet.' }) {
  return (
    <div className="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {message}
    </div>
  );
}

const COLORS = [
  ['#6366f1','#e0e7ff'],['#8b5cf6','#ede9fe'],['#06b6d4','#cffafe'],
  ['#10b981','#d1fae5'],['#f59e0b','#fef3c7'],['#ec4899','#fce7f3'],
  ['#ef4444','#fee2e2'],['#14b8a6','#ccfbf1'],
];

function colorFor(name = '') {
  const idx = name.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}

export function Avatar({ user, size = 32 }) {
  const name = user?.name || '?';
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
  const [bg, text] = colorFor(name);
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.35, background: bg + '22', color: bg, border: `1.5px solid ${bg}44` }}>
      {initials}
    </div>
  );
}

export function Badge({ status, priority, role }) {
  if (role) return <span className={`badge badge-${role}`}>{role}</span>;
  if (priority) return <span className={`badge badge-${priority}`}>{priority}</span>;
  const map = { todo:'todo','in-progress':'progress', done:'done', overdue:'overdue' };
  const labels = { todo:'To Do','in-progress':'In Progress', done:'Done', overdue:'Overdue' };
  return <span className={`badge badge-${map[status]||'todo'}`}>{labels[status]||status}</span>;
}

export function ProgressBar({ value = 0, max = 1, color }) {
  const pct = max ? Math.round((value/max)*100) : 0;
  return (
    <div className="progress-bg" style={{ marginTop: 8 }}>
      <div className="progress-fill" style={{ width: `${pct}%`, background: color || undefined }} />
    </div>
  );
}

export function StatCard({ label, value, color, icon, sub }) {
  return (
    <div className="stat-card animate-up">
      {icon && <span className="stat-icon">{icon}</span>}
      <div className="stat-num" style={{ color: color || 'var(--text-primary)' }}>{value ?? 0}</div>
      <div className="stat-lbl">{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export function Button({ children, variant, className = '', ...props }) {
  const cls = `btn ${variant === 'primary' ? 'btn-primary' : ''} ${variant === 'danger' ? 'btn-danger' : ''} ${className}`;
  return <button className={cls} {...props}>{children}</button>;
}

export function Field({ label, children }) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      {children}
    </div>
  );
}

export function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
          <div className="modal-title" style={{margin:0}}>{title}</div>
          <button onClick={onClose} className="btn btn-sm" style={{padding:'4px 8px',fontSize:16}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function taskStatusDisplay(task) {
  if (task.status === 'done') return 'done';
  if (task.due_date && new Date(task.due_date) < new Date()) return 'overdue';
  return task.status;
}

/* Donut Chart */
export function DonutChart({ segments, size = 120, thickness = 18 }) {
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  const total = segments.reduce((s,x) => s + x.value, 0) || 1;
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
      {segments.map((seg, i) => {
        const dash = (seg.value / total) * circ;
        const gap  = circ - dash;
        const el = (
          <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
            stroke={seg.color} strokeWidth={thickness}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transition:'stroke-dasharray 0.8s ease' }}
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

/* Bar Chart */
export function BarChart({ bars }) {
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div>
      {bars.map((b,i) => (
        <div key={i} className="chart-bar-wrap">
          <div className="chart-bar-label" style={{fontSize:12,color:'var(--text-secondary)',flexShrink:0,width:90}}>{b.label}</div>
          <div className="chart-bar-bg">
            <div className="chart-bar-fill" style={{ width: `${(b.value/max)*100}%`, background: b.color || 'var(--gradient)' }} />
          </div>
          <div className="chart-bar-val">{b.value}</div>
        </div>
      ))}
    </div>
  );
}

/* Activity Heatmap (mini) */
export function MiniHeatmap({ days = 28, data = {} }) {
  const today = new Date();
  const cells = Array.from({length: days}, (_,i) => {
    const d = new Date(today); d.setDate(d.getDate() - (days-1-i));
    const key = d.toISOString().slice(0,10);
    return { key, val: data[key] || 0 };
  });
  const max = Math.max(...cells.map(c=>c.val), 1);
  return (
    <div style={{display:'flex',gap:3,flexWrap:'wrap'}}>
      {cells.map((c,i) => (
        <div key={i} title={`${c.key}: ${c.val} tasks`}
          style={{ width:10, height:10, borderRadius:2, background: c.val === 0 ? 'rgba(255,255,255,0.05)' : `rgba(99,102,241,${0.2 + 0.8*(c.val/max)})` }}
        />
      ))}
    </div>
  );
}
