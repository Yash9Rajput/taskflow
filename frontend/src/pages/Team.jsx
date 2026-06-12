import React, { useState, useEffect } from 'react';
import { usersAPI, tasksAPI, projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, ProgressBar, Spinner, Empty, DonutChart } from '../components/UI';


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
        entries.forEach(e => { if (!all.find(a => a.id === e.id)) all.push({ ...e, memberId: member.id, memberName: member.name }); });
      } catch {}
    });
    return all.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  const [myProgress,  setMyProgress]  = useState(getMyProgress);
  const [allProgress, setAllProgress] = useState(getAllProgress);
  const [input,       setInput]       = useState('');
  const [expanded,    setExpanded]    = useState(false);
  const [viewMode,    setViewMode]    = useState('mine');

  const isProjectMember = (projectMembers || []).some(m => m.id === currentUser.id);

  const saveMyProgress = (entries) => {
    setMyProgress(entries);
    localStorage.setItem(`progress-${task.id}-${currentUser.id}`, JSON.stringify(entries));
    setAllProgress(getAllProgress());
  };

  const addEntry = () => {
    if (!input.trim()) return;
    saveMyProgress([{ id: Date.now(), text: input.trim(), date: new Date().toISOString().slice(0, 10), author: currentUser.name }, ...myProgress]);
    setInput('');
  };

  return (
    <div style={{ marginTop: 8, padding: '10px 12px', background: 'rgba(99,102,241,0.05)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(99,102,241,0.12)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.08em' }}>📊 Progress ({getAllProgress().length})</div>
        <button onClick={() => setExpanded(e => !e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text-3)' }}>{expanded ? '▲ Hide' : '▼ Show'}</button>
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
          {viewMode === 'mine' && (myProgress.length === 0
            ? <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: 8 }}>No updates yet.</div>
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
          {viewMode === 'all' && (allProgress.length === 0
            ? <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: 8 }}>No team updates yet.</div>
            : allProgress.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: e.memberId === currentUser.id ? '#6366f1' : '#10b981', flexShrink: 0, marginTop: 5 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: e.memberId === currentUser.id ? '#a5b4fc' : '#34d399', marginBottom: 2 }}>{e.memberName}{e.memberId === currentUser.id ? ' (you)' : ''}</div>
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

function MemberCard({ u, tasks, projects, currentUser, isAdmin, onDelete, canDelete }) {
  const [expanded,     setExpanded]     = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const uTasks  = tasks.filter(t => t.assignee_id === u.id);
  const done    = uTasks.filter(t => t.status === 'done').length;
  const inProg  = uTasks.filter(t => t.status === 'in-progress').length;
  const overdue = uTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length;
  const isMe    = u.id === currentUser.id;


  const memberProjects = projects.filter(p => (p.members || []).some(m => m.id === u.id));
  const tasksByProject = {};
  memberProjects.forEach(proj => {
    const projTasks = tasks.filter(t => t.project_id === proj.id);
    if (projTasks.length > 0) tasksByProject[proj.id] = { project: proj, tasks: projTasks };
  });
  const getProjectMembers = (pid) => projects.find(p => p.id === pid)?.members || [];

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1rem', cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <Avatar user={u} size={44} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'var(--font-d)', fontSize: 15, fontWeight: 600 }}>{u.name}</span>
            {isMe   && <span style={{ fontSize: 10, padding: '1px 6px', background: 'rgba(99,102,241,0.15)', color: '#818cf8', borderRadius: 999, border: '1px solid rgba(99,102,241,0.2)' }}>You</span>}

          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{u.email}</div>
        </div>
        <Badge role={u.role} />
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: '0.75rem' }}>
        {[{ l: 'Total', v: uTasks.length, c: 'var(--text)' }, { l: 'Done', v: done, c: '#34d399' }, { l: 'Overdue', v: overdue, c: overdue > 0 ? '#f87171' : 'var(--text-3)' }].map(s => (
          <div key={s.l} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-sm)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-d)', color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 10, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 4 }}>
            <span>Completion</span><span>{uTasks.length ? Math.round(done / uTasks.length * 100) : 0}%</span>
          </div>
          <ProgressBar value={done} max={uTasks.length} />
        </div>
        {uTasks.length > 0 && (
          <DonutChart size={48} thickness={8} segments={[
            { value: done, color: '#10b981' }, { value: inProg, color: '#6366f1' },
            { value: overdue, color: '#ef4444' }, { value: Math.max(0, uTasks.length - done - inProg - overdue), color: 'rgba(255,255,255,0.06)' },
          ].filter(s => s.value > 0)} />
        )}
      </div>

      {/* Action buttons — NO role change (removed per user request) */}
      <div style={{ display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
        {Object.keys(tasksByProject).length > 0 && (
          <button className="btn btn-sm" onClick={() => setShowProgress(s => !s)}
            style={{ flex: 1, borderColor: 'rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
            📊 {showProgress ? 'Hide' : (isMe ? 'My' : `${u.name.split(' ')[0]}'s`)} Progress
          </button>
        )}
        {canDelete && (
          <button className="btn btn-sm btn-danger" onClick={onDelete}>🗑 Remove</button>
        )}
      </div>

      {expanded && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          {Object.keys(tasksByProject).length === 0
            ? <div style={{ fontSize: 12, color: 'var(--text-3)', textAlign: 'center', padding: 8 }}>No tasks in shared projects.</div>
            : Object.entries(tasksByProject).map(([projId, { project, tasks: ptasks }]) => (
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
                      {t.assignee?.name && <span style={{ fontSize: 10, color: 'var(--text-3)', padding: '1px 6px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}>👤 {t.assignee.name.split(' ')[0]}</span>}
                      <Badge priority={t.priority} />
                      {t.due_date && <span style={{ fontSize: 10, color: new Date(t.due_date) < new Date() && t.status !== 'done' ? '#f87171' : 'var(--text-3)' }}>{t.due_date}</span>}
                    </div>
                    {showProgress && <ProgressSection task={t} currentUser={currentUser} projectMembers={getProjectMembers(projId)} />}
                  </div>
                ))}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
}

export default function Team() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';


  const [users,    setUsers]    = useState([]);
  const [tasks,    setTasks]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [invite,   setInvite]   = useState(false);
  const [form,     setForm]     = useState({ name: '', email: '', password: '', role: 'member', sendEmail: true });
  const [err,      setErr]      = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search,        setSearch]        = useState('');

  const load = () => {
    Promise.all([usersAPI.list(), tasksAPI.list(), projectsAPI.list()])
      .then(([u, t, p]) => { setUsers(u.data); setTasks(t.data); setProjects(p.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault(); setErr(''); setInviteSuccess(null);
    try {
      const res = await usersAPI.invite(form);
      setInvite(false);
      setForm({ name: '', email: '', password: '', role: 'member', sendEmail: true });
      setInviteSuccess(res.data);
      load();
    } catch (er) { setErr(er.response?.data?.error || 'Failed to invite'); }
  };

  const canDelete = (u) => {
    if (u.id === user.id) return false;  // cannot remove yourself
    return isAdmin;                       // any admin can remove others
  };

  // ISSUE #1 FIX: handleDeleteConfirmed now works correctly —
  // backend removes from shared projects + clears invited_by (account not deleted)
  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    try {
      await usersAPI.delete(deleteConfirm.id);
      setDeleteConfirm(null);
      load();
    } catch (e) {
      setDeleteConfirm(null);
      alert(e.response?.data?.error || 'Could not remove member.');
    }
  };

  // Filter to only project-shared + invited users (backend already scopes this)
  const admins  = users.filter(u => u.role === 'admin');
  const members = users.filter(u => u.role === 'member');

  const filterUsers = (list) => list.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><Spinner /></div>;

  return (
    <div>
      <div className="section-head au">
        <div>
          <h1 className="page-title" style={{ marginBottom: 4 }}>Team</h1>
          <p style={{ fontSize: 14, color: 'var(--text-2)' }}>{users.length} member{users.length !== 1 ? 's' : ''} in your teams</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search members…" style={{ fontSize: 13, minWidth: 200 }} />
          {isAdmin && <button className="btn btn-primary" onClick={() => setInvite(true)}>+ Invite Member</button>}
        </div>
      </div>

      {/* Invite success banner */}
      {inviteSuccess && (
        <div style={{ padding: '1rem 1.25rem', background: inviteSuccess.email?.sent ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', border: `1px solid ${inviteSuccess.email?.sent ? 'rgba(16,185,129,0.25)' : 'rgba(99,102,241,0.25)'}`, borderRadius: 'var(--r-md)', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: 12 }} className="au">
          <span style={{ fontSize: 20 }}>{inviteSuccess.email?.sent ? '✅' : '👤'}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: inviteSuccess.email?.sent ? '#34d399' : '#a5b4fc', fontSize: 14, marginBottom: 6 }}>
              {inviteSuccess.message}
            </div>
            {inviteSuccess.email?.sent ? (
              <div style={{ fontSize: 12, color: '#34d399', background: 'rgba(16,185,129,0.08)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(16,185,129,0.2)' }}>
                📧 Invitation email sent successfully to <strong>{inviteSuccess.user?.email}</strong><br/>
                <span style={{ color: 'var(--text-3)' }}>({inviteSuccess.email.remaining} email{inviteSuccess.email.remaining !== 1 ? 's' : ''} remaining today for this address)</span>
              </div>
            ) : inviteSuccess.email?.reason ? (
              <div style={{ fontSize: 12, color: '#fbbf24', background: 'rgba(251,191,36,0.08)', padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(251,191,36,0.2)', lineHeight: 1.6 }}>
                ⚠️ User added to team but email not sent.<br/>
                <strong>Reason:</strong> {inviteSuccess.email.reason}<br/>
                <span style={{ color: 'var(--text-3)' }}>They can still log in with the credentials you provided.</span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                👤 User added to your team. Share login credentials manually.
              </div>
            )}
          </div>
          <button onClick={() => setInviteSuccess(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 16 }}>✕</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid-3 au1" style={{ marginBottom: '1.5rem' }}>
        {[
          { label: 'Team Members', val: users.length,   color: '#818cf8', icon: '👥' },
          { label: 'Admins',       val: admins.length,  color: '#c4b5fd', icon: '👑' },
          { label: 'Members',      val: members.length, color: '#67e8f9', icon: '👤' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--grad)' }} />
            <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', fontSize: 22, opacity: 0.6 }}>{s.icon}</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 36, fontWeight: 700, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-2)', marginTop: 6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {users.length === 0 && !search && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
          <div style={{ fontSize: 48, marginBottom: '1rem' }}>👥</div>
          <div style={{ fontSize: 16, marginBottom: 8 }}>No team members yet</div>
          <div style={{ fontSize: 13 }}>{isAdmin ? 'Invite members using the button above.' : 'You will see team members once you are added to a project.'}</div>
        </div>
      )}

      {/* Admins */}
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
                currentUser={user} isAdmin={isAdmin}
                onDelete={() => setDeleteConfirm({ id: u.id, name: u.name, role: u.role })}
                canDelete={canDelete(u)} />
            ))}
          </div>
        </div>
      )}

      {/* Members */}
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
                currentUser={user} isAdmin={isAdmin}
                onDelete={() => setDeleteConfirm({ id: u.id, name: u.name, role: u.role })}
                canDelete={canDelete(u)} />
            ))}
          </div>
        </div>
      )}

      {filterUsers(users).length === 0 && search && <Empty message="No members match your search." />}

      {/* ISSUE #1 — Delete confirm with clear messaging */}
      {deleteConfirm && (
        <div onClick={() => setDeleteConfirm(null)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: 'var(--r-xl)', maxWidth: 460, width: '100%', padding: '2rem', textAlign: 'center', animation: 'scaleIn 0.2s' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>⚠️</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
              Remove from Your Team?
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 12 }}>
              <strong>{deleteConfirm.name}</strong>
              <span style={{ fontSize: 12, marginLeft: 8, padding: '2px 8px', borderRadius: 999, background: 'rgba(99,102,241,0.1)', color: '#a5b4fc' }}>{deleteConfirm.role}</span>
            </div>
            <div style={{ padding: '12px 16px', background: 'rgba(248,113,113,0.08)', borderRadius: 'var(--r-md)', border: '1px solid rgba(248,113,113,0.2)', fontSize: 13, color: 'var(--text-2)', marginBottom: '1.5rem', lineHeight: 1.8, textAlign: 'left' }}>
              🚫 Removed from all your <strong>shared projects</strong>.<br />
              👁 No longer visible in your <strong>team page</strong>.<br />
              ✅ Their <strong>account stays active</strong> — they can still log in.<br />
              🔄 You can <strong>re-invite</strong> them anytime with the same credentials.<br />
              📋 Their personal notes and data are not affected.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn" onClick={() => setDeleteConfirm(null)} style={{ minWidth: 110 }}>No, Keep</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirmed} style={{ minWidth: 110 }}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* ISSUE #2 & #3 — Invite modal with re-invite + email toggle */}
      {invite && (
        <div onClick={e => e.target === e.currentTarget && setInvite(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-hi)', borderRadius: 'var(--r-xl)', maxWidth: 490, width: '100%', animation: 'scaleIn 0.2s', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
            onClick={e => e.stopPropagation()}>
            {/* Fixed header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 1.5rem 1rem', flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-d)', fontSize: 17, fontWeight: 600 }}>Invite Team Member</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setInvite(false)}>✕</button>
            </div>
            {/* Scrollable body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '1.25rem 1.5rem' }}>

            {/* Re-invite info box */}
            <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--r-sm)', border: '1px solid rgba(99,102,241,0.15)', fontSize: 12, color: 'var(--text-2)', marginBottom: '1.25rem', lineHeight: 1.7 }}>
              💡 <strong>Re-inviting someone?</strong> Enter their existing email — their account and role will be preserved. You only need to fill in a new password if it's a brand new account.
            </div>

            <form onSubmit={handleInvite}>
              {[
                { k: 'name',     l: 'Full Name',     t: 'text',     p: 'Their name' },
                { k: 'email',    l: 'Email',         t: 'email',    p: 'email@example.com' },
                { k: 'password', l: 'Password',      t: 'password', p: 'Min 6 chars (new accounts only)' },
              ].map(f => (
                <div className="field" key={f.k}>
                  <label>{f.l}</label>
                  <input type={f.t} placeholder={f.p} value={form[f.k]}
                    onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))}
                    required={f.k !== 'password'}
                  />
                </div>
              ))}

              <div className="field">
                <label>Role (for new accounts — existing accounts keep their role)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {['member', 'admin'].map(r => (
                    <div key={r} onClick={() => setForm(p => ({ ...p, role: r }))}
                      style={{ padding: '8px', borderRadius: 'var(--r-sm)', border: `1px solid ${form.role === r ? 'var(--accent)' : 'var(--border)'}`, background: form.role === r ? 'rgba(99,102,241,0.1)' : 'transparent', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 500, color: form.role === r ? '#818cf8' : 'var(--text-2)', textTransform: 'capitalize' }}>
                      {r === 'admin' ? '👑' : '👤'} {r}
                    </div>
                  ))}
                </div>
              </div>

              {/* ISSUE #3: Email toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)', marginBottom: '1rem', cursor: 'pointer' }}
                onClick={() => setForm(p => ({ ...p, sendEmail: !p.sendEmail }))}>
                <div style={{ width: 36, height: 20, borderRadius: 999, background: form.sendEmail ? '#6366f1' : 'rgba(255,255,255,0.1)', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 2, left: form.sendEmail ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>📧 Send invite email</div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Send login details to their email (max 5 emails/day per address)</div>
                </div>
              </div>

              {err && <div style={{ padding: '8px 12px', background: 'rgba(248,113,113,0.1)', borderRadius: 8, fontSize: 12, color: '#f87171', marginBottom: '1rem', border: '1px solid rgba(248,113,113,0.2)' }}>⚠ {err}</div>}
            </form>
            </div> {/* end scrollable body */}

            {/* Fixed footer — always visible, never hidden by content */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0, background: 'var(--bg-card)' }}>
              <button type="button" className="btn" onClick={() => setInvite(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleInvite}>
                {form.sendEmail ? '📧 Invite & Email' : '➕ Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
