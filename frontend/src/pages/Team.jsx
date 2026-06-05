import React, { useState, useEffect } from 'react';
import { usersAPI, tasksAPI, projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, ProgressBar, Spinner, Empty, DonutChart } from '../components/UI';

const DEV_EMAILS = ['ry1555530@gmail.com','rajput.kyar@gmail.com'];

// Progress section — all project members can add/view progress
function ProgressSection({ task, currentUser, projectMembers }) {
  const getMyProgress = () => {
    try { return JSON.parse(localStorage.getItem(`progress-${task.id}-${currentUser.id}`) || '[]'); } catch { return []; }
  };
  const getAllProgress = () => {
    const all = [];
    [...(projectMembers || []), currentUser].forEach(member => {
      if (!member?.id) return;
      try {
        const entries = JSON.parse(localStorage.getItem(`progress-${task.id}-${member.id}`) || '[]');
        entries.forEach(e => {
          if (!all.find(a => a.id === e.id)) all.push({ ...e, memberId: member.id, memberName: member.name });
        });
      } catch {}
    });
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const [myProgress,  setMyProgress]  = useState(getMyProgress);
  const [allProgress, setAllProgress] = useState(getAllProgress);
  const [input,       setInput]       = useState('');
  const [expanded,    setExpanded]    = useState(false);
  const [viewMode,    setViewMode]    = useState('mine');

  const isProjectMember = (projectMembers || []).some(m => m.id === currentUser.id) || DEV_EMAILS.includes(currentUser.email);

  const saveMyProgress = (entries) => {
    setMyProgress(entries);
    localStorage.setItem(`progress-${task.id}-${currentUser.id}`, JSON.stringify(entries));
    setAllProgress(getAllProgress());
  };

  const addEntry = () => {
    if (!input.trim()) return;
    const entry = { id: Date.now(), text: input.trim(), date: new Date().toISOString().slice(0, 10), author: currentUser.name };
    saveMyProgress([entry, ...myProgress]);
    setInput('');
  };

  return (
    <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(99,102,241,0.12)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          📊 Progress ({getAllProgress().length} updates)
        </div>
        <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-3)' }}>
          {expanded ? '▲ Hide' : '▼ Show'}
        </button>
      </div>
      {expanded && (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['mine', 'all'].map(mode => (
              <button key={mode} onClick={() => { setViewMode(mode); if (mode === 'all') setAllProgress(getAllProgress()); }}
                style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, border: `1px solid ${viewMode === mode ? '#6366f1' : 'var(--border)'}`, background: viewMode === mode ? 'rgba(99,102,241,0.15)' : 'transparent', color: viewMode === mode ? '#a5b4fc' : 'var(--text-3)', cursor: 'pointer' }}>
                {mode === 'mine' ? 'My Updates' : `Team (${getAllProgress().length})`}
              </button>
            ))}
          </div>
          {viewMode === 'mine' && isProjectMember && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addEntry()}
                placeholder="Add your progress update…" style={{ flex: 1, fontSize: 12, padding: '6px 10px' }} />
              <button className="btn btn-primary" onClick={addEntry} style={{ fontSize: 12, padding: '6px 12px' }}>Add</button>
            </div>
          )}
          {viewMode === 'mine' && (
            myProgress.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '8px' }}>No updates yet.</div>
              : myProgress.map(e => (
                <div key={e.id} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{e.text}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{e.date}</div>
                  </div>
                  {isProjectMember && (
                    <button onClick={() => saveMyProgress(myProgress.filter(x => x.id !== e.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', fontSize: 12, padding: 2 }}>✕</button>
                  )}
                </div>
              ))
          )}
          {viewMode === 'all' && (
            allProgress.length === 0
              ? <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '8px' }}>No team updates yet.</div>
              : allProgress.map((e, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.memberId === currentUser.id ? '#6366f1' : '#10b981', flexShrink: 0, marginTop: 5 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: e.memberId === currentUser.id ? '#a5b4fc' : '#34d399', marginBottom: 2 }}>
                      {e.memberName} {e.memberId === currentUser.id ? '(you)' : ''}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{e.text}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>{e.date}</div>
                  </div>
                </div>
              ))
          )}
        </>
      )}
    </div>
  );
}

function MemberCard({ u, tasks, projects, currentUser, isDev, isAdmin, onDelete, canDelete }) {
  const [expanded,     setExpanded]     = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  // Only show tasks where this member is the assignee (for stats)
  const uTasks  = tasks.filter(t => t.assignee_id === u.id);
  const done    = uTasks.filter(t => t.status === 'done').length;
  const inProg  = uTasks.filter(t => t.status === 'in-progress').length;
  const overdue = uTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length;
  const isMe    = u.id === currentUser.id;
  const isDevU  = DEV_EMAILS.includes(u.email);

  // Find all projects this member is in
  const memberProjects = projects.filter(p => (p.members || []).some(m => m.id === u.id));

  // Group all project tasks by project (not just assigned)
  const tasksByProject = {};
  memberProjects.forEach(proj => {
    const projTasks = tasks.filter(t => t.project_id === proj.id);
    if (projTasks.length > 0) {
      tasksByProject[proj.id] = { project: proj, tasks: projTasks };
    }
  });

  const getProjectMembers = (projectId) => {
    const proj = projects.find(p => p.id === projectId);
    return proj?.members || [];
  };

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem', cursor: 'pointer' }}
        onClick={() => setExpanded(e => !e)}>
        <Avatar user={u} size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-d)', fontSize: 15, fontWeight: 600 }}>{u.name}</span>
            {isMe   && <span style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: 999, border: '1px solid rgba(99,102,241,0.2)' }}>You</span>}
            {isDevU && <span style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(16,185,129,0.15)', color: '#34d399', borderRadius: 999, border: '1px solid rgba(16,185,129,0.2)' }}>Developer</span>}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.email}</div>
        </div>
        <Badge role={u.role} />
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '0.75rem' }}>
        {[{ l: 'Total', v: uTasks.length, c: 'var(--text)' }, { l: 'Done', v: done, c: '#34d399' }, { l: 'Overdue', v: overdue, c: overdue > 0 ? '#f87171' : 'var(--text-3)' }].map(s => (
          <div key={s.l} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-sm)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-d)', color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
            <span>Completion</span>
            <span>{uTasks.length ? Math.round(done / uTasks.length * 100) : 0}%</span>
          </div>
          <ProgressBar value={done} max={uTasks.length} />
        </div>
        {uTasks.length > 0 && (
          <DonutChart size={48} thickness={8} segments={[
            { value: done, color: '#10b981' }, { value: inProg, color: '#6366f1' },
            { value: overdue, color: '#ef4444' },
            { value: Math.max(0, uTasks.length - done - inProg - overdue), color: 'rgba(255,255,255,0.06)' },
          ].filter(s => s.value > 0)} />
        )}
      </div>

      {/* Action buttons — NO role change button (issue #5 fix) */}
      <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
        {Object.keys(tasksByProject).length > 0 && (
          <button className="btn btn-sm" onClick={() => setShowProgress(s => !s)}
            style={{ flex: 1, borderColor: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
            📊 {showProgress ? 'Hide' : (isMe ? 'My' : `${u.name.split(' ')[0]}'s`)} Progress
          </button>
        )}
        {canDelete && (
          <button className="btn btn-sm btn-danger" onClick={onDelete}>🗑 Delete</button>
        )}
      </div>

      {/* Expanded tasks grouped by project */}
      {expanded && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          {Object.keys(tasksByProject).length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: '8px' }}>No tasks in shared projects.</div>
          ) : Object.entries(tasksByProject).map(([projId, { project, tasks: ptasks }]) => (
            <div key={projId} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#a5b4fc' }}>{project.name}</span>
                <span style={{ fontSize: 10, color: 'var(--text-3)' }}>({ptasks.length} task{ptasks.length !== 1 ? 's' : ''})</span>
              </div>
              {ptasks.map(t => (
                <div key={t.id} style={{ paddingLeft: 14, marginBottom: showProgress ? 12 : 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.status === 'done' ? '#10b981' : t.status === 'in-progress' ? '#6366f1' : '#f59e0b', flexShrink: 0 }} />
                    <span style={{ flex: 1, color: 'var(--text-2)' }}>{t.title}</span>
                    {t.assignee?.name && (
                      <span style={{ fontSize: 10, color: 'var(--text-3)', padding: '1px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>
                        👤 {t.assignee.name.split(' ')[0]}
                      </span>
                    )}
                    <Badge priority={t.priority} />
                    {t.due_date && (
                      <span style={{ fontSize: 10, color: new Date(t.due_date) < new Date() && t.status !== 'done' ? '#f87171' : 'var(--text-3)' }}>
                        {t.due_date}
                      </span>
                    )}
                  </div>
                  {showProgress && (
                    <ProgressSection task={t} currentUser={currentUser} projectMembers={getProjectMembers(projId)} />
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Team() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDev   = DEV_EMAILS.includes(user?.email);

  const [users,    setUsers]    = useState([]);
  const [tasks,    setTasks]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [invite,   setInvite]   = useState(false);
  const [form,     setForm]     = useState({ name: '', email: '', password: '', role: 'member' });
  const [err,      setErr]      = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search,        setSearch]        = useState('');

  const load = () => {
    Promise.all([usersAPI.list(), tasksAPI.list(), projectsAPI.list()])
      .then(([u, t, p]) => { setUsers(u.data); setTasks(t.data); setProjects(p.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault(); setErr('');
    try { await usersAPI.invite(form); setInvite(false); setForm({ name: '', email: '', password: '', role: 'member' }); load(); }
    catch (er) { setErr(er.response?.data?.error || 'Failed'); }
  };

  const canDelete = (u) => {
    if (u.id === user.id) return false;
    if (DEV_EMAILS.includes(u.email)) return false;
    return isDev || isAdmin;
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    try { await usersAPI.delete(deleteConfirm.id); setDeleteConfirm(null); load(); }
    catch { setDeleteConfirm(null); alert('Could not delete member.'); }
  };

  // ISSUE #1 FIX: Only show users who share at least one project with the current user
  // OR users invited by the current admin
  // For developer accounts: show all users
  const getVisibleUsers = () => {
    if (isDev) return users; // Developer sees everyone

    // Get all project IDs the current user is part of
    const myProjectIds = new Set(
      projects
        .filter(p => (p.members || []).some(m => m.id === user.id))
        .map(p => p.id)
    );

    // Get all user IDs who share a project with current user
    const visibleUserIds = new Set([user.id]); // always include self
    projects.forEach(p => {
      if (myProjectIds.has(p.id)) {
        (p.members || []).forEach(m => visibleUserIds.add(m.id));
      }
    });

    // If admin: also include users they personally created (invited)
    // We show users who are in the visible set
    return users.filter(u => visibleUserIds.has(u.id));
  };

  const visibleUsers = getVisibleUsers();
  const admins  = visibleUsers.filter(u => u.role === 'admin');
  const members = visibleUsers.filter(u => u.role === 'member');

  const filterUsers = (list) => list.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><Spinner /></div>;

  return (
    <div>
      <div className="section-head au">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Team</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{visibleUsers.length} member{visibleUsers.length !== 1 ? 's' : ''} in your teams</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search members…" style={{ fontSize: 13, minWidth: 200 }} />
          {isAdmin && <button className="btn btn-primary" onClick={() => setInvite(true)}>+ Invite Member</button>}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid-3 au1" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Team Members', val: visibleUsers.length, color: '#818cf8', icon: '👥' },
          { label: 'Admins',       val: admins.length,        color: '#c4b5fd', icon: '👑' },
          { label: 'Members',      val: members.length,       color: '#67e8f9', icon: '👤' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--grad)' }} />
            <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', fontSize: 22, opacity: 0.6 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 36, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-2)', marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {visibleUsers.length === 0 && !search && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>👥</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>No team members yet</div>
          <div style={{ fontSize: 13 }}>
            {isAdmin ? 'Invite members to your projects to see them here.' : 'You will see team members once you are added to a project.'}
          </div>
        </div>
      )}

      {/* Admins group */}
      {filterUsers(admins).length > 0 && (
        <div className="au2" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#c4b5fd', padding: '3px 12px', borderRadius: 999, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
              👑 Admins ({filterUsers(admins).length})
            </span>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          </div>
          <div className="grid-2">
            {filterUsers(admins).map(u => (
              <MemberCard key={u.id} u={u} tasks={tasks} projects={projects}
                currentUser={user} isDev={isDev} isAdmin={isAdmin}
                onDelete={() => setDeleteConfirm({ id: u.id, name: u.name })}
                canDelete={canDelete(u)} />
            ))}
          </div>
        </div>
      )}

      {/* Members group */}
      {filterUsers(members).length > 0 && (
        <div className="au3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#67e8f9', padding: '3px 12px', borderRadius: 999, background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
              👤 Members ({filterUsers(members).length})
            </span>
            <div style={{ height: 1, flex: 1, background: 'var(--border)' }} />
          </div>
          <div className="grid-2">
            {filterUsers(members).map(u => (
              <MemberCard key={u.id} u={u} tasks={tasks} projects={projects}
                currentUser={user} isDev={isDev} isAdmin={isAdmin}
                onDelete={() => setDeleteConfirm({ id: u.id, name: u.name })}
                canDelete={canDelete(u)} />
            ))}
          </div>
        </div>
      )}

      {filterUsers(visibleUsers).length === 0 && search && (
        <Empty message="No members match your search." />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: 'var(--r-xl)', maxWidth: 400, width: '100%', padding: '2rem', textAlign: 'center', animation: 'scaleIn 0.2s' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>⚠️</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Remove Member?</div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 4 }}><strong>{deleteConfirm.name}</strong></div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              They will lose access to the platform.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setDeleteConfirm(null)} style={{ minWidth: 100 }}>No, Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirmed} style={{ minWidth: 100 }}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {invite && (
        <div onClick={e => e.target === e.currentTarget && setInvite(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: 'var(--r-xl)', maxWidth: 480, width: '100%', padding: '2rem', animation: 'scaleIn 0.2s' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontFamily: 'var(--font-d)', fontSize: 17, fontWeight: 600 }}>Invite Team Member</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setInvite(false)}>✕</button>
            </div>
            <form onSubmit={handleInvite}>
              {[{ k: 'name', l: 'Full Name', t: 'text', p: 'Their name' }, { k: 'email', l: 'Email', t: 'email', p: 'email@example.com' }, { k: 'password', l: 'Temp Password', t: 'password', p: 'Min 6 characters' }].map(f => (
                <div className="field" key={f.k}>
                  <label>{f.l}</label>
                  <input type={f.t} placeholder={f.p} value={form[f.k]} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} required />
                </div>
              ))}
              <div className="field">
                <label>Role</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['member', 'admin'].map(r => (
                    <div key={r} onClick={() => setForm(p => ({ ...p, role: r }))}
                      style={{ padding: '8px', borderRadius: 'var(--r-sm)', border: `1px solid ${form.role === r ? 'var(--accent)' : 'var(--border)'}`, background: form.role === r ? 'rgba(99,102,241,0.1)' : 'transparent', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 500, color: form.role === r ? '#818cf8' : 'var(--text-2)', textTransform: 'capitalize' }}>
                      {r === 'admin' ? '👑' : '👤'} {r}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ padding: '10px 12px', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(99,102,241,0.15)', fontSize: 12, color: 'var(--text-2)', marginBottom: '1rem', lineHeight: 1.6 }}>
                💡 Share these credentials with the invited member so they can log in.
              </div>
              {err && <div style={{ color: '#f87171', fontSize: 12, marginBottom: 10 }}>{err}</div>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn" onClick={() => setInvite(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create & Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
