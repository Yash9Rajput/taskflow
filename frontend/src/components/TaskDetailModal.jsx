import React from 'react';
import { Avatar, Badge, taskStatusDisplay } from './UI';

export default function TaskDetailModal({ task, users, projects, onClose, onEdit }) {
  const assignee = users?.find(u => u.id === task.assignee_id);
  const project  = projects?.find(p => p.id === task.project_id);
  const status   = taskStatusDisplay(task);

  const statusColors   = { todo: '#818cf8', 'in-progress': '#fbbf24', done: '#34d399', overdue: '#f87171' };
  const priorityColors = { low: '#34d399', medium: '#fbbf24', high: '#f87171' };

  return (
    /* Use position:fixed + inset:0 so the overlay covers the FULL viewport
       including the footer — nothing can clip it */
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-hi)',
          borderRadius: 'var(--r-xl)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          maxWidth: 520,
          width: '100%',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease',
        }}>

        {/* ── Fixed header ── */}
        <div style={{ padding: '1.5rem 1.5rem 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div style={{ flex: 1, paddingRight: '1rem' }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                <Badge status={status} />
                <Badge priority={task.priority} />
              </div>
              <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 700, lineHeight: 1.3, margin: 0 }}>
                {task.title}
              </h2>
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ flexShrink: 0 }}>✕</button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 1.5rem' }}>

          {/* Description */}
          <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-md)', padding: '1rem', marginBottom: '1.25rem', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
              Description
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
              {task.description
                ? task.description
                : <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>No description provided.</span>}
            </div>
          </div>

          {/* Meta grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: '1.5rem' }}>
            {[
              {
                label: 'Assignee',
                content: assignee
                  ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar user={assignee} size={24} />
                      <span style={{ fontSize: 13 }}>{assignee.name}</span>
                    </div>
                  )
                  : <span style={{ color: 'var(--text-3)', fontSize: 13 }}>Unassigned</span>,
              },
              {
                label: 'Project',
                content: <span style={{ fontSize: 13 }}>{project?.name || '—'}</span>,
              },
              {
                label: 'Due Date',
                content: (
                  <span style={{
                    fontSize: 13,
                    color: task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
                      ? '#f87171' : 'var(--text)',
                  }}>
                    {task.due_date || '—'}
                  </span>
                ),
              },
              {
                label: 'Created',
                content: <span style={{ fontSize: 13 }}>{task.created_at?.slice(0, 10) || '—'}</span>,
              },
              {
                label: 'Priority',
                content: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColors[task.priority] || '#818cf8' }} />
                    <span style={{ fontSize: 13, textTransform: 'capitalize' }}>{task.priority}</span>
                  </div>
                ),
              },
              {
                label: 'Status',
                content: (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColors[status] || 'var(--accent)' }} />
                    <span style={{ fontSize: 13 }}>
                      {status === 'in-progress' ? 'In Progress' : (status?.charAt(0).toUpperCase() + status?.slice(1))}
                    </span>
                  </div>
                ),
              },
            ].map(item => (
              <div key={item.label} style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  {item.label}
                </div>
                {item.content}
              </div>
            ))}
          </div>
        </div>

        {/* ── Fixed footer actions ── */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button className="btn" onClick={onClose}>Close</button>
          {onEdit && (
            <button className="btn btn-primary" onClick={() => onEdit(task)}>✎ Edit Task</button>
          )}
        </div>
      </div>
    </div>
  );
}
