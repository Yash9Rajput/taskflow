import React, { useState, useEffect, useCallback } from 'react';
import { tasksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, Button, Spinner, Empty, taskStatusDisplay } from '../components/UI';
import TaskModal from '../components/TaskModal';

const TABS = [
  { key: 'all',         label: 'All' },
  { key: 'todo',        label: 'To do' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'done',        label: 'Done' },
  { key: 'overdue',     label: 'Overdue' },
];

export default function Tasks() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks]         = useState([]);
  const [tab, setTab]             = useState('all');
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask]   = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (tab === 'overdue')           params.overdue = true;
    else if (tab !== 'all')          params.status  = tab;
    tasksAPI.list(params).then(r => setTasks(r.data)).finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    await tasksAPI.delete(id);
    setTasks(t => t.filter(x => x.id !== id));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Tasks</div>
        {isAdmin && <Button variant="primary" size="sm" onClick={() => { setEditTask(null); setShowModal(true); }}>+ New task</Button>}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '0.5px solid var(--color-border-tertiary)', marginBottom: '1rem' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '7px 14px', fontSize: 13, cursor: 'pointer',
              border: 'none', background: 'none', fontFamily: 'var(--font-sans)',
              color: tab === t.key ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
              borderBottom: tab === t.key ? '2px solid #185FA5' : '2px solid transparent',
              fontWeight: tab === t.key ? 500 : 400, marginBottom: -1,
            }}>{t.label}</button>
        ))}
      </div>

      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '0.25rem 1.25rem' }}>
        {loading ? <Spinner /> : tasks.length === 0 ? <Empty message="No tasks here." /> :
          tasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
              <Avatar user={t.assignee} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {t.project?.name} · {t.assignee?.name || 'Unassigned'} · due {t.due_date || '—'}
                </div>
              </div>
              <Badge priority={t.priority} />
              <Badge status={taskStatusDisplay(t)} />
              {(isAdmin || t.is_mine) && (
                <Button size="sm" onClick={() => { setEditTask(t); setShowModal(true); }}>✎</Button>
              )}
              {isAdmin && (
                <Button size="sm" variant="danger" onClick={() => handleDelete(t.id)}>✕</Button>
              )}
            </div>
          ))
        }
      </div>

      {showModal && (
        <TaskModal
          task={editTask}
          onClose={() => setShowModal(false)}
          onSaved={(saved) => {
            setTasks(prev => editTask ? prev.map(t => t.id === saved.id ? saved : t) : [saved, ...prev]);
          }}
        />
      )}
    </div>
  );
}
