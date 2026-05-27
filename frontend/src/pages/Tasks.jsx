import React, { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, Spinner, Empty, taskStatusDisplay } from '../components/UI';
import TaskDetailModal from '../components/TaskDetailModal';

const DEV_EMAILS = ['ry1555530@gmail.com','rajput.kyar@gmail.com'];

const TABS = [
  { key:'all',         label:'All',         color:'#818cf8' },
  { key:'todo',        label:'To Do',       color:'#6366f1' },
  { key:'in-progress', label:'In Progress', color:'#fbbf24' },
  { key:'done',        label:'Done',        color:'#34d399' },
  { key:'overdue',     label:'Overdue',     color:'#f87171' },
];

const PRIORITY_OPTIONS = ['low','medium','high','urgent'];
const STATUS_OPTIONS   = ['todo','in-progress','done'];

/* ─── Inline Task Form ─── */
function TaskForm({ initial, projects, users, onSave, onCancel }) {
  const [form, setForm] = useState({
    title:       initial?.title       || '',
    description: initial?.description || '',
    project_id:  initial?.project_id  || '',
    assignee_id: initial?.assignee_id || '',
    status:      initial?.status      || 'todo',
    priority:    initial?.priority    || 'medium',
    due_date:    initial?.due_date    || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Task title is required.'); return; }
    setSaving(true); setError('');
    try {
      // Send null instead of empty string — empty strings break many backends
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim() || null,
        project_id:  form.project_id  || null,
        assignee_id: form.assignee_id || null,
        status:      form.status,
        priority:    form.priority,
        due_date:    form.due_date    || null,
      };
      if (initial) {
        await tasksAPI.update(initial.id, payload);
      } else {
        await tasksAPI.create(payload);
      }
      onSave();
    } catch (e) {
      console.error('Task save error:', e);
      setError(e?.response?.data?.message || e?.message || 'Failed to save task. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const labelStyle = {
    fontSize: 11, fontWeight: 600, color: 'var(--text-3)',
    textTransform: 'uppercase', letterSpacing: '0.08em',
    display: 'block', marginBottom: 6,
  };
  const selectStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 'var(--r-sm)',
    border: '1px solid var(--border)',
    background: 'var(--bg-input, rgba(255,255,255,0.05))',
    color: 'var(--text)', fontSize: 13,
  };

  return (
    <div style={{ overflowY: 'auto' }}>
      {/* Header — same style as Notes "New Note" header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <button className="btn" onClick={onCancel}
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
          ← Back
        </button>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 600 }}>
          {initial ? 'Edit Task' : 'New Task'}
        </h2>
      </div>

      {/* Card — same full-width card as Notes form, no maxWidth constraint */}
      <div className="card" style={{ padding: '2rem' }}>
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        <div className="field">
          <label style={labelStyle}>Title *</label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="Task title"
            style={{ fontSize: 18, fontFamily: 'var(--font-d)', fontWeight: 600 }}
            autoFocus
          />
        </div>

        <div className="field">
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="What needs to be done?"
            style={{ minHeight: 140, lineHeight: 1.8, fontSize: 14 }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: '1rem' }}>
          <div>
            <label style={labelStyle}>Project</label>
            <select value={form.project_id} onChange={e => set('project_id', e.target.value)} style={selectStyle}>
              <option value="">— No Project —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Assignee</label>
            <select value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)} style={selectStyle}>
              <option value="">Unassigned</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)} style={selectStyle}>
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={labelStyle}>Priority</label>
            <select value={form.priority} onChange={e => set('priority', e.target.value)} style={selectStyle}>
              {PRIORITY_OPTIONS.map(p => (
                <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label style={labelStyle}>Due Date</label>
          <input
            type="date"
            value={form.due_date}
            onChange={e => set('due_date', e.target.value)}
            style={{ fontSize: 14 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Tasks Component ─── */
export default function Tasks() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDev   = DEV_EMAILS.includes(user?.email);

  const [tasks,    setTasks]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [tab,      setTab]      = useState('all');
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState('list'); // 'list' | 'new' | 'edit'
  const [editTask, setEditTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [search,   setSearch]   = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([tasksAPI.list(), projectsAPI.list(), usersAPI.list()])
      .then(([t, p, u]) => { setTasks(t.data); setProjects(p.data); setUsers(u.data); })
      .catch(err => console.error('Load error:', err))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const now = new Date();
  const isOverdue = t => t.status !== 'done' && t.due_date && new Date(t.due_date) < now;

  const filtered = tasks.filter(t => {
    const matchTab    = tab === 'all' ? true : tab === 'overdue' ? isOverdue(t) : (t.status === tab && !isOverdue(t));
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    all:           tasks.length,
    todo:          tasks.filter(t => t.status === 'todo').length,
    'in-progress': tasks.filter(t => t.status === 'in-progress').length,
    done:          tasks.filter(t => t.status === 'done').length,
    overdue:       tasks.filter(isOverdue).length,
  };

  const canDeleteTask = (t) => isDev || (isAdmin && t.created_by === user.id);

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    try { await tasksAPI.delete(deleteConfirm.id); }
    catch(e) { console.error('Delete error:', e); }
    finally { setDeleteConfirm(null); load(); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner />
    </div>
  );

  /* ── Inline form views ── */
  if (view === 'new') return (
    <TaskForm
      projects={projects} users={users}
      onSave={() => { load(); setView('list'); }}
      onCancel={() => setView('list')}
    />
  );
  if (view === 'edit' && editTask) return (
    <TaskForm
      initial={editTask} projects={projects} users={users}
      onSave={() => { load(); setView('list'); setEditTask(null); }}
      onCancel={() => { setView('list'); setEditTask(null); }}
    />
  );

  return (
    <div style={{ overflowY: 'auto' }}>

      {/* ── Header — matches Team page section-head exactly ── */}
      <div className="section-head au">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Tasks</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{tasks.length} total tasks</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditTask(null); setView('new'); }}>
            + New Task
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }} className="au1">
        <div className="tabs">
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
              {t.label}
              <span style={{
                marginLeft: 5, padding: '1px 7px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                background: tab === t.key ? `${t.color}25` : 'rgba(255,255,255,0.06)',
                color: tab === t.key ? t.color : 'var(--text-3)',
              }}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="🔍  Search tasks…"
          style={{ flex: 1, minWidth: 200, maxWidth: 300, fontSize: 13 }}
        />
      </div>

      <div className="card au2" style={{ padding: '0.5rem 1.5rem', overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px 80px 110px 100px', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', marginBottom: 4, minWidth: 580 }}>
          {['Task','Assignee','Priority','Status','Actions'].map(h => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {filtered.length === 0
          ? <Empty message={`No ${tab} tasks found.`} />
          : filtered.map(t => {
              const assignee = users.find(u => u.id === t.assignee_id);
              const proj     = projects.find(p => p.id === t.project_id);
              const canEdit  = isAdmin || t.assignee_id === user.id;
              const od       = isOverdue(t);
              return (
                <div key={t.id}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 130px 80px 110px 100px', gap: 12, padding: '11px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center', cursor: 'pointer', borderRadius: 'var(--r-sm)', transition: 'background 0.15s', minWidth: 580 }}
                  onClick={() => setViewTask(t)}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{t.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {proj?.name || '—'} · {od
                        ? <span style={{ color: '#f87171' }}>⚠ {t.due_date}</span>
                        : (t.due_date || 'No date')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => e.stopPropagation()}>
                    <Avatar user={assignee || { name: '?' }} size={24} />
                    <span style={{ fontSize: 12, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {assignee?.name?.split(' ')[0] || '—'}
                    </span>
                  </div>
                  <div onClick={e => e.stopPropagation()}><Badge priority={t.priority} /></div>
                  <div onClick={e => e.stopPropagation()}><Badge status={taskStatusDisplay(t)} /></div>
                  <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                    <button className="btn btn-sm" onClick={() => setViewTask(t)} title="View">👁</button>
                    {canEdit && (
                      <button className="btn btn-sm" onClick={() => { setEditTask(t); setView('edit'); }}>✎</button>
                    )}
                    {canDeleteTask(t) && (
                      <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm({ id: t.id, name: t.title })}>✕</button>
                    )}
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* ── Delete confirm ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>⚠️</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Delete Task?</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>
              <strong style={{ color: 'var(--text)' }}>&ldquo;{deleteConfirm.name}&rdquo;</strong>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              This will permanently delete this task. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setDeleteConfirm(null)} style={{ minWidth: 100 }}>No, Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirmed} style={{ minWidth: 100 }}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {viewTask && (
        <TaskDetailModal
          task={viewTask} users={users} projects={projects}
          onClose={() => setViewTask(null)}
          onEdit={t => { setEditTask(t); setViewTask(null); setView('edit'); }}
        />
      )}
    </div>
  );
}
