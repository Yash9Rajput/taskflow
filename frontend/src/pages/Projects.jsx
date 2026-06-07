import React, { useState, useEffect } from 'react';
import { projectsAPI, tasksAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, ProgressBar, Spinner, Empty, taskStatusDisplay } from '../components/UI';
import TaskDetailModal from '../components/TaskDetailModal';

const DEV_EMAILS = ['ry1555530@gmail.com', 'rajput.kyar@gmail.com'];

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  color: 'var(--text-3)', marginBottom: 6,
};

const selectStyle = {
  width: '100%', padding: '10px 12px', borderRadius: 'var(--r-sm)',
  background: 'var(--bg-card)', border: '1px solid var(--border)',
  color: 'var(--text)', fontSize: 14, cursor: 'pointer',
};

/* ─── Inline Project Form (full page like Notes) ─── */
function ProjectForm({ initial, users, currentUserId, onSave, onCancel }) {
  const [form, setForm] = useState({
    name:        initial?.name        || '',
    description: initial?.description || '',
    memberIds:   initial?.members?.map(m => m.id || m) || [],
  });
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMember = (id) => setForm(f => ({
    ...f,
    memberIds: f.memberIds.includes(id)
      ? f.memberIds.filter(x => x !== id)
      : [...f.memberIds, id],
  }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Project name is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = { name: form.name, description: form.description, member_ids: form.memberIds };
      if (initial) await projectsAPI.update(initial.id, payload);
      else          await projectsAPI.create(payload);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save project');
    } finally { setSaving(false); }
  };

  // ISSUE #3 FIX: Only show users who already share a project with current user
  // (i.e. users returned from /api/users which is already scoped)
  // Filter out current user from member picker (they're auto-added as creator)
  const eligibleUsers = users.filter(u => u.id !== currentUserId);
  const filteredUsers = eligibleUsers.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ animation: 'scaleIn 0.3s ease', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
      {/* Header — same style as Notes */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <button className="btn" onClick={onCancel}
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
          ← Back
        </button>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 600 }}>
          {initial ? 'Edit Project' : 'New Project'}
        </h2>
      </div>

      {/* Card — same width/centering as Notes form */}
      <div className="card" style={{ padding: '2rem', width: '100%', maxWidth: 720, margin: '0 auto', boxSizing: 'border-box' }}>
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        <div className="field">
          <label style={labelStyle}>Project Name *</label>
          <input
            value={form.name} onChange={e => set('name', e.target.value)}
            placeholder="e.g. Website Redesign"
            style={{ fontSize: 18, fontFamily: 'var(--font-d)', fontWeight: 600 }}
            autoFocus
          />
        </div>

        <div className="field">
          <label style={labelStyle}>Description</label>
          <textarea
            value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="What is this project about?"
            style={{ minHeight: 120, lineHeight: 1.8, fontSize: 14 }}
          />
        </div>

        <div className="field">
          <label style={labelStyle}>Team Members ({form.memberIds.length} selected)</label>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search members…"
            style={{ marginBottom: 12, fontSize: 13 }}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
            {filteredUsers.map(u => {
              const sel = form.memberIds.includes(u.id);
              return (
                <div key={u.id} onClick={() => toggleMember(u.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 'var(--r-sm)', border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`, background: sel ? 'rgba(99,102,241,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <Avatar user={u} size={32} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? '#a5b4fc' : 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-3)', textTransform: 'capitalize' }}>{u.role}</div>
                  </div>
                  {sel && <span style={{ color: 'var(--accent)', fontSize: 16, flexShrink: 0 }}>✓</span>}
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '1rem', color: 'var(--text-3)', fontSize: 13 }}>No members found.</div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saving…' : '💾 Save Project'}
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

  const [projects,  setProjects]  = useState([]);
  const [tasks,     setTasks]     = useState([]);
  const [users,     setUsers]     = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [view,      setView]      = useState('list'); // 'list' | 'new' | 'edit'
  const [editProj,  setEditProj]  = useState(null);
  const [showTM,    setShowTM]    = useState(false);
  const [editTask,  setEditTask]  = useState(null);
  const [viewTask,  setViewTask]  = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [taskFilter,    setTaskFilter]    = useState('all');
  const [leaveConfirm,  setLeaveConfirm]  = useState(null); // Issue #2: leave project

  const load = () => {
    setLoading(true);
    Promise.all([projectsAPI.list(), usersAPI.list()])
      .then(([p, u]) => { setProjects(p.data); setUsers(u.data); })
      .catch(err => console.error('Load error:', err))
      .finally(() => setLoading(false));
  };
  const loadTasks = (pid) => tasksAPI.list({ project_id: pid }).then(r => setTasks(r.data));

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selected) loadTasks(selected); else setTasks([]); }, [selected]);

  const selProject = projects.find(p => p.id === selected);
  const projTasks  = tasks.filter(t => t.project_id === selected);

  const filteredTasks = projTasks.filter(t => {
    if (taskFilter === 'all') return true;
    if (taskFilter === 'overdue') return t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date();
    return t.status === taskFilter;
  });

  const canDeleteProject = (p) => isDev || (isAdmin && p.created_by === user.id);
  const canDeleteTask    = (t) => isDev || (isAdmin && t.created_by === user.id);

  const handleLeaveProject = async () => {
    if (!leaveConfirm) return;
    try {
      await usersAPI.leaveProject(user.id, leaveConfirm.id);
      setSelected(null);
      setLeaveConfirm(null);
      load();
    } catch (e) {
      console.error('Leave project error:', e);
      setLeaveConfirm(null);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'project') { await projectsAPI.delete(deleteConfirm.id); setSelected(null); load(); }
      else { await tasksAPI.delete(deleteConfirm.id); loadTasks(selected); }
    } catch (e) { console.error(e); }
    finally { setDeleteConfirm(null); }
  };

  const filteredProjects = projects.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const taskCounts = {
    all:           projTasks.length,
    todo:          projTasks.filter(t => t.status === 'todo').length,
    'in-progress': projTasks.filter(t => t.status === 'in-progress').length,
    done:          projTasks.filter(t => t.status === 'done').length,
    overdue:       projTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length,
  };

  /* ── Full-page inline add/edit forms (no modal, no footer overlap) ── */
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spinner />
    </div>
  );

  if (view === 'new') return (
    <ProjectForm
      users={users}
      currentUserId={user.id}
      onSave={() => { load(); setView('list'); }}
      onCancel={() => setView('list')}
    />
  );

  if (view === 'edit' && editProj) return (
    <ProjectForm
      initial={editProj}
      users={users}
      currentUserId={user.id}
      onSave={() => { load(); setView('list'); setEditProj(null); }}
      onCancel={() => { setView('list'); setEditProj(null); }}
    />
  );

  /* ── Inline Task Add/Edit form inside project detail ── */
  if (showTM) {
    return (
      <InlineTaskForm
        task={editTask}
        projects={projects}
        users={users}
        defaultProjectId={selected}
        onSave={() => { if (selected) loadTasks(selected); setShowTM(false); setEditTask(null); }}
        onCancel={() => { setShowTM(false); setEditTask(null); }}
      />
    );
  }

  return (
    <div>
      {/* Page header — same layout as Tasks/Notes/Team */}
      <div className="section-head au">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Projects</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{projects.length} projects</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search projects…"
            style={{ fontSize: 13, minWidth: 200 }}
          />
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setView('new')}>
              + New Project
            </button>
          )}
        </div>
      </div>

      {/* Project cards grid */}
      <div className="grid-3 au1" style={{ marginBottom: '1.5rem' }}>
        {filteredProjects.map(p => {
          const total = p.task_stats?.total || 0;
          const done  = p.task_stats?.done  || 0;
          const pct   = total > 0 ? Math.round((done / total) * 100) : 0;
          const isSel = selected === p.id;
          const ICONS = ['📁','🚀','💡','🎯','⚙️','🌟','🔥','💎'];
          const icon  = ICONS[p.name.charCodeAt(0) % ICONS.length];

          return (
            <div key={p.id}
              className={`card card-hover${isSel ? ' card-selected' : ''}`}
              style={{ padding: '1.25rem', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
              onClick={() => { setSelected(isSel ? null : p.id); setTaskFilter('all'); }}>

              {isSel && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--grad)' }} />}

              {/* Top row: icon + actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--r-sm)', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  {icon}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                  {isAdmin && (
                    <button className="btn btn-sm" style={{ padding: '4px 10px' }}
                      onClick={() => { setEditProj(p); setView('edit'); }}>✎</button>
                  )}
                  {canDeleteProject(p) && (
                    <button className="btn btn-sm btn-danger" style={{ padding: '4px 10px' }}
                      onClick={() => setDeleteConfirm({ id: p.id, type: 'project', name: p.name })}>🗑</button>
                  )}
                </div>
              </div>

              {/* Project name + description */}
              <div style={{ fontFamily: 'var(--font-d)', fontSize: 15, fontWeight: 600, marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: '0.875rem', lineHeight: 1.5, minHeight: 32, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {p.description || 'No description'}
              </div>

              {/* Member avatars */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '0.75rem', minHeight: 28 }}>
                {(p.members || []).length === 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>No members</span>
                )}
                {(p.members || []).slice(0, 6).map((m, i) => (
                  <div key={m.id || i} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i }} title={m.name}>
                    <Avatar user={m} size={26} />
                  </div>
                ))}
                {(p.members || []).length > 6 && (
                  <span style={{ fontSize: 10, color: 'var(--text-3)', marginLeft: 6 }}>+{p.members.length - 6}</span>
                )}
              </div>

              {/* Task count + completion % */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
                <span>{total} task{total !== 1 ? 's' : ''}</span>
                <span style={{ fontWeight: 600, color: pct === 100 ? '#34d399' : 'var(--text-2)' }}>{pct}%</span>
              </div>
              <ProgressBar value={done} max={total} />

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
            <Empty message={search ? 'No projects match your search.' : 'No projects yet. Click + New Project to create one!'} />
          </div>
        )}
      </div>

      {/* Expanded project detail panel */}
      {selected && selProject && (
        <div className="card au" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          {/* Project header + stats */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{selProject.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.5 }}>{selProject.description || 'No description'}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { l: 'Total',   v: projTasks.length,                                                                            c: '#818cf8' },
                { l: 'Done',    v: projTasks.filter(t => t.status === 'done').length,                                           c: '#34d399' },
                { l: 'Active',  v: projTasks.filter(t => t.status === 'in-progress').length,                                    c: '#fbbf24' },
                { l: 'Overdue', v: projTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length, c: '#f87171' },
              ].map(s => (
                <div key={s.l} style={{ textAlign: 'center', padding: '8px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', minWidth: 64 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-d)', color: s.c }}>{s.v}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Team members in project */}
          {(selProject.members || []).length > 0 && (
            <div style={{ marginBottom: '1.25rem', padding: '0.875rem 1rem', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--r-md)', border: '1px solid rgba(99,102,241,0.12)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>👥 Team</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selProject.members.map(m => {
                  const mt = projTasks.filter(t => t.assignee_id === m.id);
                  const md = mt.filter(t => t.status === 'done').length;
                  return (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                      <Avatar user={m} size={26} />
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

          {/* Task list header */}
          <div className="section-head" style={{ marginBottom: '0.875rem' }}>
            <div>
              <div className="section-title">Tasks</div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Click any task to view details</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {/* ISSUE #2: Leave project for any user who is NOT the project creator */}
              {selProject && selProject.created_by !== user.id && (
                <button className="btn btn-sm"
                  style={{ borderColor: '#f87171', color: '#f87171', background: 'rgba(248,113,113,0.08)' }}
                  onClick={() => setLeaveConfirm(selProject)}>
                  🚪 Leave Project
                </button>
              )}
              {isAdmin && (
                <button className="btn btn-primary btn-sm"
                  onClick={() => { setEditTask(null); setShowTM(true); }}>
                  + Add Task
                </button>
              )}
            </div>
          </div>

          {/* Task filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: '1rem', flexWrap: 'wrap' }}>
            {[
              { k: 'all',         color: '#818cf8', l: 'All' },
              { k: 'todo',        color: '#6366f1', l: 'To Do' },
              { k: 'in-progress', color: '#fbbf24', l: 'In Progress' },
              { k: 'done',        color: '#34d399', l: 'Done' },
              { k: 'overdue',     color: '#f87171', l: 'Overdue' },
            ].map(({ k, color, l }) => (
              <button key={k} onClick={() => setTaskFilter(k)}
                style={{ padding: '4px 12px', borderRadius: 999, border: `1px solid ${taskFilter === k ? color : 'var(--border)'}`, background: taskFilter === k ? `${color}18` : 'transparent', fontSize: 12, fontWeight: 500, color: taskFilter === k ? color : 'var(--text-3)', cursor: 'pointer', transition: 'all 0.15s' }}>
                {l} <strong>{taskCounts[k]}</strong>
              </button>
            ))}
          </div>

          {/* Task rows */}
          {filteredTasks.length === 0
            ? <Empty message="No tasks match this filter." />
            : filteredTasks.map(t => {
              const assignee  = users.find(u => u.id === t.assignee_id);
              const canEdit   = isAdmin || t.assignee_id === user.id;
              const isOverdue = t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date();
              return (
                <div key={t.id}>
                  <div className="task-row" style={{ cursor: 'pointer' }} onClick={() => setViewTask(t)}>
                    <Avatar user={assignee || { name: '?' }} size={32} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{t.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                        {assignee?.name || 'Unassigned'} · {isOverdue
                          ? <span style={{ color: '#f87171' }}>⚠ Overdue: {t.due_date}</span>
                          : (t.due_date || 'No due date')}
                      </div>
                    </div>
                    <Badge priority={t.priority} />
                    <Badge status={taskStatusDisplay(t)} />
                    <span style={{ fontSize: 11, color: 'var(--text-3)', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>View →</span>
                    {canEdit && (
                      <button className="btn btn-sm"
                        onClick={e => { e.stopPropagation(); setEditTask(t); setShowTM(true); }}>✎</button>
                    )}
                    {canDeleteTask(t) && (
                      <button className="btn btn-sm btn-danger"
                        onClick={e => { e.stopPropagation(); setDeleteConfirm({ id: t.id, type: 'task', name: t.title }); }}>✕</button>
                    )}
                  </div>
                  <div className="task-divider" />
                </div>
              );
            })
          }
        </div>
      )}

      {/* Delete confirm modal */}
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
                ? 'Permanently deletes the project and all its tasks.'
                : 'Permanently deletes this task.'}
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
          onEdit={viewTask.assignee_id === user.id
            ? t => { setEditTask(t); setViewTask(null); setShowTM(true); }
            : null}
        />
      )}

      {/* Issue #2: Leave project confirmation */}
      {leaveConfirm && (
        <div onClick={() => setLeaveConfirm(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: 'var(--r-xl)', maxWidth: 440, width: '100%', padding: '2rem', textAlign: 'center', animation: 'scaleIn 0.2s' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>🚪</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Leave this project?</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 12 }}><strong>{leaveConfirm.name}</strong></div>
            <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.08)', borderRadius: 'var(--r-md)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 13, color: 'var(--text-2)', marginBottom: '1.5rem', lineHeight: 1.7, textAlign: 'left' }}>
              ⚠️ You will be <strong>removed from this project</strong>.<br/>
              📋 This project and its tasks will disappear from your view.<br/>
              🔒 Only an admin can add you back.<br/>
              👤 Your account and other projects are not affected.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setLeaveConfirm(null)} style={{ minWidth: 110 }}>No, Stay</button>
              <button className="btn btn-danger" onClick={handleLeaveProject} style={{ minWidth: 110 }}>Yes, Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Inline Task Form (used when adding/editing task inside a project) ─── */
function InlineTaskForm({ task, projects, users, defaultProjectId, onSave, onCancel }) {
  const [form, setForm] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    project_id:  task?.project_id  || defaultProjectId || (projects[0]?.id ?? ''),
    assignee_id: task?.assignee_id || '',
    status:      task?.status      || 'todo',
    priority:    task?.priority    || 'medium',
    due_date:    task?.due_date    || '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        title:       form.title,
        description: form.description,
        status:      form.status,
        priority:    form.priority,
        project_id:  form.project_id  || null,
        assignee_id: form.assignee_id || null,
        due_date:    form.due_date    || null,
      };
      if (task) await tasksAPI.update(task.id, payload);
      else       await tasksAPI.create(payload);
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally { setSaving(false); }
  };

  const STATUS_OPTIONS   = ['todo', 'in-progress', 'done'];
  const PRIORITY_OPTIONS = ['low', 'medium', 'high'];

  return (
    <div style={{ overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.5rem' }}>
        <button className="btn" onClick={onCancel}
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
          ← Back
        </button>
        <h2 style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 600 }}>
          {task ? 'Edit Task' : 'New Task'}
        </h2>
      </div>

      <div className="card" style={{ padding: '2rem', width: '100%', maxWidth: 720, margin: '0 auto', boxSizing: 'border-box' }}>
        {error && (
          <div style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: 13 }}>
            ⚠ {error}
          </div>
        )}

        <div className="field">
          <label style={labelStyle}>Title *</label>
          <input value={form.title} onChange={e => set('title', e.target.value)}
            placeholder="Task title" style={{ fontSize: 18, fontFamily: 'var(--font-d)', fontWeight: 600 }} autoFocus />
        </div>

        <div className="field">
          <label style={labelStyle}>Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="What needs to be done?" style={{ minHeight: 120, lineHeight: 1.8, fontSize: 14 }} />
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
                <option key={s} value={s}>{s === 'in-progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
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
          <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} style={{ fontSize: 14 }} />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button className="btn" onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '⏳ Saving…' : '💾 Save Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
