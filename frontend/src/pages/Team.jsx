import React, { useState, useEffect } from 'react';
import { usersAPI, tasksAPI, projectsAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, ProgressBar, Spinner, Empty, DonutChart } from '../components/UI';

const DEV_EMAILS = ['ry1555530@gmail.com','rajput.kyar@gmail.com'];

// Progress entry for a member on a task
function ProgressSection({ task, currentUser, isDev }) {
  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`progress-${task.id}-${currentUser.id}`) || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);

  const isAssignee = task.assignee_id === currentUser.id;
  const canEdit    = isDev || isAssignee;

  const saveProgress = (entries) => {
    setProgress(entries);
    localStorage.setItem(`progress-${task.id}-${currentUser.id}`, JSON.stringify(entries));
  };

  const addEntry = () => {
    if (!input.trim()) return;
    const entry = { id: Date.now(), text: input.trim(), date: new Date().toISOString().slice(0,10), author: currentUser.name };
    saveProgress([entry, ...progress]);
    setInput('');
  };

  const deleteEntry = (id) => saveProgress(progress.filter(e => e.id !== id));

  return (
    <div style={{marginTop:8,padding:'10px 12px',background:'rgba(99,102,241,0.05)',borderRadius:'var(--r-sm)',border:'1px solid rgba(99,102,241,0.12)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
        <div style={{fontSize:11,fontWeight:600,color:'#a5b4fc',textTransform:'uppercase',letterSpacing:'0.08em'}}>
          📊 My Progress ({progress.length} updates)
        </div>
        <button onClick={()=>setExpanded(e=>!e)} style={{background:'none',border:'none',cursor:'pointer',fontSize:11,color:'var(--text-3)'}}>
          {expanded ? '▲ Hide' : '▼ Show'}
        </button>
      </div>

      {expanded && (
        <>
          {canEdit && (
            <div style={{display:'flex',gap:6,marginBottom:8}}>
              <input value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&addEntry()}
                placeholder="Add progress update…"
                style={{flex:1,fontSize:12,padding:'6px 10px'}}/>
              <button className="btn btn-primary" onClick={addEntry} style={{fontSize:12,padding:'6px 12px'}}>Add</button>
            </div>
          )}
          {progress.length === 0 ? (
            <div style={{fontSize:12,color:'var(--text-3)',textAlign:'center',padding:'8px'}}>No progress updates yet.</div>
          ) : progress.map(e=>(
            <div key={e.id} style={{display:'flex',alignItems:'flex-start',gap:8,padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.05)'}}>
              <div style={{width:6,height:6,borderRadius:'50%',background:'#6366f1',flexShrink:0,marginTop:5}}/>
              <div style={{flex:1}}>
                <div style={{fontSize:12,color:'var(--text-2)'}}>{e.text}</div>
                <div style={{fontSize:10,color:'var(--text-3)',marginTop:2}}>{e.author} · {e.date}</div>
              </div>
              {canEdit && (
                <button onClick={()=>deleteEntry(e.id)} style={{background:'none',border:'none',cursor:'pointer',color:'#f87171',fontSize:12,padding:2}}>✕</button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function MemberCard({ u, tasks, projects, currentUser, isDev, isAdmin, onRoleToggle, onDelete, canDelete }) {
  const [expanded, setExpanded]       = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const uTasks  = tasks.filter(t => t.assignee_id === u.id);
  const done    = uTasks.filter(t => t.status==='done').length;
  const inProg  = uTasks.filter(t => t.status==='in-progress').length;
  const overdue = uTasks.filter(t => t.status!=='done'&&t.due_date&&new Date(t.due_date)<new Date()).length;
  const isMe    = u.id === currentUser.id;
  const isDevU  = DEV_EMAILS.includes(u.email);

  // Group member's tasks by project
  const tasksByProject = {};
  uTasks.forEach(t => {
    const proj = projects.find(p => p.id === t.project_id);
    const key  = proj?.name || 'Unknown Project';
    if (!tasksByProject[key]) tasksByProject[key] = { project: proj, tasks: [] };
    tasksByProject[key].tasks.push(t);
  });

  return (
    <div className="card" style={{padding:'1.25rem'}}>
      {/* Member header */}
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1rem',cursor:'pointer'}} onClick={()=>setExpanded(e=>!e)}>
        <Avatar user={u} size={44}/>
        <div style={{flex:1}}>
          <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
            <span style={{fontFamily:'var(--font-d)',fontSize:15,fontWeight:600}}>{u.name}</span>
            {isMe    && <span style={{fontSize:10,padding:'1px 6px',background:'rgba(99,102,241,0.15)',color:'#818cf8',borderRadius:999,border:'1px solid rgba(99,102,241,0.2)'}}>You</span>}
            {isDevU  && <span style={{fontSize:10,padding:'1px 6px',background:'rgba(16,185,129,0.15)',color:'#34d399',borderRadius:999,border:'1px solid rgba(16,185,129,0.2)'}}>Developer</span>}
          </div>
          <div style={{fontSize:12,color:'var(--text-3)'}}>{u.email}</div>
        </div>
        <Badge role={u.role}/>
        <span style={{fontSize:11,color:'var(--text-3)'}}>{expanded?'▲':'▼'}</span>
      </div>

      {/* Stats row */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:'0.75rem'}}>
        {[{l:'Total',v:uTasks.length,c:'var(--text)'},{l:'Done',v:done,c:'#34d399'},{l:'Overdue',v:overdue,c:overdue>0?'#f87171':'var(--text-3)'}].map(s=>(
          <div key={s.l} style={{textAlign:'center',padding:'8px',background:'rgba(255,255,255,0.03)',borderRadius:'var(--r-sm)'}}>
            <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--font-d)',color:s.c}}>{s.v}</div>
            <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'0.75rem'}}>
        <div style={{flex:1}}>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-3)',marginBottom:4}}>
            <span>Completion</span>
            <span>{uTasks.length?Math.round(done/uTasks.length*100):0}%</span>
          </div>
          <ProgressBar value={done} max={uTasks.length}/>
        </div>
        {uTasks.length>0&&(
          <DonutChart size={48} thickness={8} segments={[
            {value:done,color:'#10b981'},{value:inProg,color:'#6366f1'},
            {value:overdue,color:'#ef4444'},{value:Math.max(0,uTasks.length-done-inProg-overdue),color:'rgba(255,255,255,0.06)'},
          ].filter(s=>s.value>0)}/>
        )}
      </div>

      {/* Action buttons */}
      <div style={{display:'flex',gap:8}} onClick={e=>e.stopPropagation()}>
        {isAdmin && !isMe && !isDevU && (
          <button className="btn btn-sm" onClick={onRoleToggle} style={{flex:1}}>
            {u.role==='admin'?'→ Member':'→ Admin'}
          </button>
        )}
        {(isMe || isDev) && uTasks.length > 0 && (
          <button className="btn btn-sm" onClick={()=>setShowProgress(s=>!s)} style={{flex:1,borderColor:'rgba(99,102,241,0.3)',color:'#a5b4fc'}}>
            📊 {showProgress?'Hide':'My'} Progress
          </button>
        )}
        {canDelete && (
          <button className="btn btn-sm btn-danger" onClick={onDelete}>🗑 Delete</button>
        )}
      </div>

      {/* Expanded: tasks grouped by project */}
      {expanded && (
        <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid var(--border)'}}>
          {uTasks.length === 0 ? (
            <div style={{fontSize:12,color:'var(--text-3)',textAlign:'center',padding:'8px'}}>No tasks assigned.</div>
          ) : Object.entries(tasksByProject).map(([projName, {project, tasks: ptasks}])=>(
            <div key={projName} style={{marginBottom:'1rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                <div style={{width:6,height:6,borderRadius:'50%',background:'#6366f1',flexShrink:0}}/>
                <span style={{fontSize:12,fontWeight:600,color:'#a5b4fc'}}>{projName}</span>
                <span style={{fontSize:10,color:'var(--text-3)'}}>({ptasks.length} tasks)</span>
              </div>
              {ptasks.map(t=>(
                <div key={t.id} style={{paddingLeft:14,marginBottom:6}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,fontSize:12}}>
                    <div style={{width:5,height:5,borderRadius:'50%',background:t.status==='done'?'#10b981':t.status==='in-progress'?'#6366f1':'#f59e0b',flexShrink:0}}/>
                    <span style={{flex:1,color:'var(--text-2)'}}>{t.title}</span>
                    <Badge priority={t.priority}/>
                    {t.due_date && <span style={{fontSize:10,color:new Date(t.due_date)<new Date()&&t.status!=='done'?'#f87171':'var(--text-3)'}}>{t.due_date}</span>}
                  </div>
                  {/* Progress section for the current user's own tasks */}
                  {(isMe || isDev) && showProgress && (
                    <ProgressSection task={t} currentUser={currentUser} isDev={isDev}/>
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
  const [form,     setForm]     = useState({name:'',email:'',password:'',role:'member'});
  const [err,      setErr]      = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [search,        setSearch]        = useState('');

  const load = () => {
    Promise.all([usersAPI.list(), tasksAPI.list(), projectsAPI.list()])
      .then(([u,t,p]) => { setUsers(u.data); setTasks(t.data); setProjects(p.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault(); setErr('');
    try { await usersAPI.invite(form); setInvite(false); setForm({name:'',email:'',password:'',role:'member'}); load(); }
    catch(er) { setErr(er.response?.data?.error||'Failed'); }
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

  const admins  = users.filter(u => u.role === 'admin');
  const members = users.filter(u => u.role === 'member');

  const filterUsers = (list) => list.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><Spinner/></div>;

  return (
    <div style={{overflowY:'auto'}}>
      <div className="section-head au">
        <div>
          <h1 className="page-title" style={{marginBottom:4}}>Team</h1>
          <p style={{fontSize:14,color:'var(--text-2)'}}>{users.length} members · {admins.length} admins</p>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Search members…" style={{fontSize:13,minWidth:200}}/>
          {isAdmin && <button className="btn btn-primary" onClick={()=>setInvite(true)}>+ Invite Member</button>}
        </div>
      </div>

      {/* Summary */}
      <div className="grid-3 au1" style={{marginBottom:'1.5rem'}}>
        {[
          {label:'Total Members', val:users.length,   color:'#818cf8', icon:'👥'},
          {label:'Admins',        val:admins.length,  color:'#c4b5fd', icon:'👑'},
          {label:'Members',       val:members.length, color:'#67e8f9', icon:'👤'},
        ].map(s=>(
          <div key={s.label} className="stat-card" style={{position:'relative'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'var(--grad)'}}/>
            <div style={{position:'absolute',top:'1.2rem',right:'1.2rem',fontSize:22,opacity:0.6}}>{s.icon}</div>
            <div style={{fontFamily:'var(--font-d)',fontSize:36,fontWeight:700,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-2)',marginTop:6}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Admins group */}
      {filterUsers(admins).length > 0 && (
        <div className="au2" style={{marginBottom:'2rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'1rem'}}>
            <div style={{height:1,flex:1,background:'var(--border)'}}/>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#c4b5fd',padding:'3px 12px',borderRadius:999,background:'rgba(139,92,246,0.1)',border:'1px solid rgba(139,92,246,0.2)'}}>👑 Admins ({filterUsers(admins).length})</span>
            <div style={{height:1,flex:1,background:'var(--border)'}}/>
          </div>
          <div className="grid-2">
            {filterUsers(admins).map(u=>(
              <MemberCard key={u.id} u={u} tasks={tasks} projects={projects}
                currentUser={user} isDev={isDev} isAdmin={isAdmin}
                onRoleToggle={async()=>{await usersAPI.updateRole(u.id,u.role==='admin'?'member':'admin');load();}}
                onDelete={()=>setDeleteConfirm({id:u.id,name:u.name})}
                canDelete={canDelete(u)}/>
            ))}
          </div>
        </div>
      )}

      {/* Members group */}
      {filterUsers(members).length > 0 && (
        <div className="au3">
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:'1rem'}}>
            <div style={{height:1,flex:1,background:'var(--border)'}}/>
            <span style={{fontSize:11,fontWeight:700,letterSpacing:'0.1em',textTransform:'uppercase',color:'#67e8f9',padding:'3px 12px',borderRadius:999,background:'rgba(6,182,212,0.1)',border:'1px solid rgba(6,182,212,0.2)'}}>👤 Members ({filterUsers(members).length})</span>
            <div style={{height:1,flex:1,background:'var(--border)'}}/>
          </div>
          <div className="grid-2">
            {filterUsers(members).map(u=>(
              <MemberCard key={u.id} u={u} tasks={tasks} projects={projects}
                currentUser={user} isDev={isDev} isAdmin={isAdmin}
                onRoleToggle={async()=>{await usersAPI.updateRole(u.id,u.role==='admin'?'member':'admin');load();}}
                onDelete={()=>setDeleteConfirm({id:u.id,name:u.name})}
                canDelete={canDelete(u)}/>
            ))}
          </div>
        </div>
      )}

      {filterUsers(users).length===0 && <Empty message={search?"No members match your search.":"No team members yet."}/>}

      {/* Delete confirm */}
      {deleteConfirm&&(
        <div className="modal-overlay" onClick={()=>setDeleteConfirm(null)}>
          <div className="modal-box" style={{maxWidth:400,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:48,marginBottom:'1rem'}}>⚠️</div>
            <div style={{fontFamily:'var(--font-d)',fontSize:18,fontWeight:600,marginBottom:8}}>Remove Member?</div>
            <div style={{fontSize:14,color:'var(--text-2)',marginBottom:4}}><strong>{deleteConfirm.name}</strong></div>
            <div style={{fontSize:13,color:'var(--text-3)',marginBottom:'1.5rem',lineHeight:1.6}}>
              Are you sure? Their tasks remain but they lose access.
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="btn" onClick={()=>setDeleteConfirm(null)} style={{minWidth:100}}>No, Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirmed} style={{minWidth:100}}>Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {invite&&(
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setInvite(false)}>
          <div className="modal-box">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <div style={{fontFamily:'var(--font-d)',fontSize:17,fontWeight:600}}>Invite Team Member</div>
              <button className="btn btn-ghost btn-sm" onClick={()=>setInvite(false)}>✕</button>
            </div>
            <form onSubmit={handleInvite}>
              {[{k:'name',l:'Full Name',t:'text',p:'Their name'},{k:'email',l:'Email',t:'email',p:'email@example.com'},{k:'password',l:'Temp Password',t:'password',p:'Min 6 characters'}].map(f=>(
                <div className="field" key={f.k}>
                  <label>{f.l}</label>
                  <input type={f.t} placeholder={f.p} value={form[f.k]} onChange={e=>setForm(p=>({...p,[f.k]:e.target.value}))} required/>
                </div>
              ))}
              <div className="field">
                <label>Role</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {['member','admin'].map(r=>(
                    <div key={r} onClick={()=>setForm(p=>({...p,role:r}))}
                      style={{padding:'8px',borderRadius:'var(--r-sm)',border:`1px solid ${form.role===r?'var(--accent)':'var(--border)'}`,background:form.role===r?'rgba(99,102,241,0.1)':'transparent',cursor:'pointer',textAlign:'center',fontSize:13,fontWeight:500,color:form.role===r?'#818cf8':'var(--text-2)',textTransform:'capitalize'}}>
                      {r==='admin'?'👑':'👤'} {r}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{padding:'10px 12px',background:'rgba(99,102,241,0.08)',borderRadius:'var(--r-sm)',border:'1px solid rgba(99,102,241,0.15)',fontSize:12,color:'var(--text-2)',marginBottom:'1rem',lineHeight:1.6}}>
                💡 The invited member will need to log in with these credentials. Share them securely.
              </div>
              {err&&<div style={{color:'#f87171',fontSize:12,marginBottom:10}}>{err}</div>}
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button type="button" className="btn" onClick={()=>setInvite(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Account & Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
