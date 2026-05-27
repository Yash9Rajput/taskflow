import React, { useState, useEffect } from 'react';
import { projectsAPI, tasksAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, ProgressBar, Spinner, Empty, taskStatusDisplay, DonutChart } from '../components/UI';
import TaskDetailModal from '../components/TaskDetailModal';

const DEV_EMAILS = ['ry1555530@gmail.com','rajput.kyar@gmail.com'];

/* ─── Inline Project Form ─── */
function ProjectForm({ initial, users, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:        initial?.name        || '',
    description: initial?.description || '',
    member_ids:  (initial?.members || []).map(m => m.id),
  });
  const [memberSearch, setMemberSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMember = (id) => {
    set('member_ids', form.member_ids.includes(id)
      ? form.member_ids.filter(x => x !== id)
      : [...form.member_ids, id]);
  };

  const filteredUsers = users.filter(u =>
    !memberSearch ||
    u.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Project name is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        name:        form.name.trim(),
        description: form.description.trim() || null,
        member_ids:  form.member_ids,
      };
      if (initial) {
        await projectsAPI.update(initial.id, payload);
      } else {
        await projectsAPI.create(payload);
      }
      onSave();
    } catch (e) {
      console.error('Project save error:', e);
      setError(e?.response?.data?.message || e?.message || 'Failed to save project. Please try again.');
    } finally {
      setSaving(false);
    }
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
          {initial ? 'Edit Project' : 'New Project'}
        </h2>
      </div>

      {/* Card — same width/padding as Notes form card */}
      <div className="card" style={{ padding: '2rem' }}>
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        <div className="field">
          <label>Project Name *</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            placeholder="e.g. Website Redesign"
            style={{ fontSize: 18, fontFamily: 'var(--font-d)', fontWeight: 600 }}
            autoFocus
          />
        </div>

        <div className="field">
          <label>Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="What is this project about?"
            style={{ minHeight: 140, lineHeight: 1.8, fontSize: 14 }}
          />
        </div>

        <div className="field">
          <label>Team Members ({form.member_ids.length} selected)</label>
          <input
            value={memberSearch}
            onChange={e => setMemberSearch(e.target.value)}
            placeholder="🔍 Search members..."
            style={{ marginBottom: 10 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
            {filteredUsers.map(u => {
              const sel = form.member_ids.includes(u.id);
              return (
                <div key={u.id}
                  onClick={() => toggleMember(u.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', borderRadius: 'var(--r-sm)',
                    cursor: 'pointer', transition: 'all 0.15s',
                    border: `1px solid ${sel ? 'rgba(99,102,241,0.5)' : 'var(--border)'}`,
                    background: sel ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.02)',
                  }}>
                  <Avatar user={u} size={28} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{u.role}</div>
                  </div>
                  {sel && <span style={{ color: '#818cf8', fontSize: 16, flexShrink: 0 }}>✓</span>}
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem', color: 'var(--text-3)', fontSize: 13 }}>
                No members found.
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saving...' : '💾 Save Project'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Projects Component ─── */
export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDev   = DEV_EMAILS.includes(user?.email);

  const [projects, setProjects] = useState([]);
  const [tasks,    setTasks]    = useState([]);
  const [users,    setUsers]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [view,     setView]     = useState('list'); // 'list' | 'new' | 'edit'
  const [editProj, setEditProj] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [editTask, setEditTask] = useState(null);
  const [showTM,   setShowTM]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [taskFilter,    setTaskFilter]    = useState('all');

  const load = () => {
    setLoading(true);
    Promise.all([projectsAPI.list(), usersAPI.list()])
      .then(([p, u]) => { setProjects(p.data); setUsers(u.data); })
      .catch(err => console.error('Load error:', err))
      .finally(() => setLoading(false));
  };

  const loadTasks = (pid) => {
    tasksAPI.list({ projectId: pid })
      .then(r => setTasks(r.data))
      .catch(err => console.error('Load tasks error:', err));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selected) loadTasks(selected); else setTasks([]); }, [selected]);

  const selProject = projects.find(p => p.id === selected);
  const projTasks  = tasks.filter(t => t.project_id === selected);

  const now = new Date();
  const isOD = t => t.status !== 'done' && t.due_date && new Date(t.due_date) < now;

  const filteredTasks = projTasks.filter(t => {
    if (taskFilter === 'all')     return true;
    if (taskFilter === 'overdue') return isOD(t);
    return t.status === taskFilter;
  });

  const taskCounts = {
    all:           projTasks.length,
    todo:          projTasks.filter(t => t.status === 'todo').length,
    'in-progress': projTasks.filter(t => t.status === 'in-progress').length,
    done:          projTasks.filter(t => t.status === 'done').length,
    overdue:       projTasks.filter(isOD).length,
  };

  const canDeleteProject = (p) => isDev || (isAdmin && p.created_by === user.id);
  const canDeleteTask    = (t) => isDev || (isAdmin && t.created_by === user.id);

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'project') {
        await projectsAPI.delete(deleteConfirm.id);
        setSelected(null);
        load();
      } else {
        await tasksAPI.delete(deleteConfirm.id);
        loadTasks(selected);
      }
    } catch(e) { console.error('Delete error:', e); }
    finally { setDeleteConfirm(null); }
  };

  const filteredProjects = projects.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner />
    </div>
  );

  /* ── Inline form views ── */
  if (view === 'new') return (
    <ProjectForm
      users={users}
      onSave={() => { load(); setView('list'); }}
      onCancel={() => setView('list')}
    />
  );
  if (view === 'edit' && editProj) return (
    <ProjectForm
      initial={editProj}
      users={users}
      onSave={() => { load(); setView('list'); setEditProj(null); }}
      onCancel={() => { setView('list'); setEditProj(null); }}
    />
  );

  return (
    <div style={{ overflowY: 'auto' }}>

      {/* ── Header — matches Team page section-head exactly ── */}
      <div className="section-head au">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Projects</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{projects.length} projects</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search projects..."
            style={{ fontSize: 13, minWidth: 200 }}
          />
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setView('new')}>+ New Project</button>
          )}
        </div>
      </div>

      {/* ── Project cards ── */}
      <div className="grid-3 au1" style={{ marginBottom: '1.5rem' }}>
        {filteredProjects.map(p => {
          const pct   = p.total_tasks ? Math.round(p.done_tasks / p.total_tasks * 100) : 0;
          const isSel = selected === p.id;
          return (
            <div key={p.id}
              className={`card card-hover${isSel ? ' card-selected' : ''}`}
              style={{ padding: '1.5rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              onClick={() => { setSelected(isSel ? null : p.id); setTaskFilter('all'); }}>
              {isSel && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--grad)' }} />}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ width: 42, height: 42, borderRadius: 'var(--r-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                  {['📁','🚀','💡','🎯','⚙️','🌟','🔥','💎'][p.name.charCodeAt(0) % 8]}
                </div>
                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                  {isAdmin && (
                    <button className="btn btn-sm" onClick={() => { setEditProj(p); setView('edit'); }}>✎</button>
                  )}
                  {canDeleteProject(p) && (
                    <button className="btn btn-sm btn-danger" onClick={() => setDeleteConfirm({ id: p.id, type: 'project', name: p.name })}>🗑</button>
                  )}
                </div>
              </div>

              <div style={{ fontFamily: 'var(--font-d)', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: '0.75rem', lineHeight: 1.5 }}>{p.description || 'No description'}</div>

              <div style={{ display: 'flex', gap: 4, marginBottom: '0.75rem', alignItems: 'center' }}>
                {(p.members || []).slice(0, 5).map((m, i) => (
                  <div key={m.id || i} style={{ marginLeft: i ? -6 : 0 }} title={m.name}>
                    <Avatar user={m} size={24} />
                  </div>
                ))}
                {(p.members || []).length > 5 && (
                  <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 4 }}>+{p.members.length - 5} more</span>
                )}
                {(p.members || []).length === 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>No members</span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
                <span>{p.total_tasks || 0} tasks</span>
                <span style={{ fontWeight: 600, color: pct === 100 ? '#34d399' : 'var(--text-2)' }}>{pct}%</span>
              </div>
              <ProgressBar value={p.done_tasks || 0} max={p.total_tasks || 0} />

              {isSel && (
                <div style={{ marginTop: 10, fontSize: 11, color: '#a5b4fc', textAlign: 'center' }}>
                  ▼ See tasks & team below
                </div>
              )}
            </div>
          );
        })}
        {filteredProjects.length === 0 && (
          <div style={{ gridColumn: '1/-1' }}>
            <Empty message={search ? 'No projects match your search.' : 'No projects yet.'} />
          </div>
        )}
      </div>

      {/* ── Expanded project detail panel ── */}
      {selected && selProject && (
        <div className="card au" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                  {['📁','🚀','💡','🎯','⚙️','🌟','🔥','💎'][selProject.name.charCodeAt(0) % 8]}
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 700 }}>{selProject.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{selProject.description || 'No description'}</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {[
                { l: 'Total',   v: projTasks.length,                                        c: '#818cf8' },
                { l: 'Done',    v: projTasks.filter(t => t.status === 'done').length,        c: '#34d399' },
                { l: 'Active',  v: projTasks.filter(t => t.status === 'in-progress').length, c: '#fbbf24' },
                { l: 'Overdue', v: projTasks.filter(isOD).length,                            c: '#f87171' },
              ].map(s => (
                <div key={s.l} style={{ textAlign: 'center', padding: '10px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', minWidth: 70 }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-d)', color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {(selProject.members || []).length > 0 && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--r-md)', border: '1px solid rgba(99,102,241,0.12)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>👥 Team Members</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {selProject.members.map(m => {
                  const mt = projTasks.filter(t => t.assignee_id === m.id);
                  const md = mt.filter(t => t.status === 'done').length;
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                      <Avatar user={m} size={28} />
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 500 }}>{m.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{mt.length} tasks · {md} done</div>
                      </div>
                      <Badge role={m.role} />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="section-head" style={{ marginBottom: '1rem' }}>
            <div>
              <div className="section-title">Tasks</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Click any task to view details</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            {[
              { k: 'all',         color: '#818cf8', l: 'All' },
              { k: 'todo',        color: '#6366f1', l: 'To Do' },
              { k: 'in-progress', color: '#fbbf24', l: 'In Progress' },
              { k: 'done',        color: '#34d399', l: 'Done' },
              { k: 'overdue',     color: '#f87171', l: 'Overdue' },
            ].map(({ k, color, l }) => (
              <button key={k} onClick={() => setTaskFilter(k)}
                style={{ padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s', border: `1px solid ${taskFilter === k ? color : 'var(--border)'}`, background: taskFilter === k ? `${color}18` : 'transparent', color: taskFilter === k ? color : 'var(--text-3)' }}>
                {l} <span style={{ fontWeight: 700 }}>{taskCounts[k]}</span>
              </button>
            ))}
          </div>

          {filteredTasks.length === 0
            ? <Empty message="No tasks match this filter." />
            : filteredTasks.map(t => {
                const assignee = users.find(u => u.id === t.assignee_id);
                const canEdit  = isAdmin || t.assignee_id === user.id;
                const od       = isOD(t);
                return (
                  <div key={t.id}>
                    <div className="task-row" style={{ cursor: 'pointer' }} onClick={() => setViewTask(t)}>
                      <Avatar user={assignee || { name: '?' }} size={32} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                          {assignee?.name || 'Unassigned'} · {od
                            ? <span style={{ color: '#f87171' }}>⚠ Overdue: {t.due_date}</span>
                            : (t.due_date || 'No due date')}
                        </div>
                      </div>
                      <Badge priority={t.priority} />
                      <Badge status={taskStatusDisplay(t)} />
                      <span style={{ fontSize: 11, color: 'var(--text-3)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>View →</span>
                      {canEdit && (
                        <button className="btn btn-sm" onClick={e => { e.stopPropagation(); setEditTask(t); setShowTM(true); }}>✎</button>
                      )}
                      {canDeleteTask(t) && (
                        <button className="btn btn-sm btn-danger" onClick={e => { e.stopPropagation(); setDeleteConfirm({ id: t.id, type: 'task', name: t.title }); }}>✕</button>
                      )}
                    </div>
                    <div className="task-divider" />
                  </div>
                );
              })
          }
        </div>
      )}

      {/* ── Confirm delete ── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-box" style={{ maxWidth: 400, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>⚠️</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Delete {deleteConfirm.type === 'project' ? 'Project' : 'Task'}?
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}>
              <strong>&ldquo;{deleteConfirm.name}&rdquo;</strong>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              {deleteConfirm.type === 'project'
                ? 'This will permanently delete the project and all its tasks.'
                : 'This will permanently delete this task.'}
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
          onEdit={t => { setEditTask(t); setViewTask(null); setShowTM(true); }}
        />
      )}
    </div>
  );
}
