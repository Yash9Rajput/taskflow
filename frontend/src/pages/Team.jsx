import React, { useState, useEffect } from 'react';
import { usersAPI, tasksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, ProgressBar, Spinner, Empty, DonutChart } from '../components/UI';
import { DEVELOPER_EMAIL } from '../App';

export default function Team() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDev   = user?.email === DEVELOPER_EMAIL;

  const [users,   setUsers]   = useState([]);
  const [tasks,   setTasks]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [invite,  setInvite]  = useState(false);
  const [form,    setForm]    = useState({name:'',email:'',password:'',role:'member'});
  const [err,     setErr]     = useState('');
  const [expanded,    setExpanded]    = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => {
    Promise.all([usersAPI.list(), tasksAPI.list()])
      .then(([u,t]) => { setUsers(u.data); setTasks(t.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault(); setErr('');
    try { await usersAPI.invite(form); setInvite(false); setForm({name:'',email:'',password:'',role:'member'}); load(); }
    catch(er) { setErr(er.response?.data?.error||'Failed'); }
  };

  const handleRoleToggle = async (u) => {
    await usersAPI.updateRole(u.id, u.role==='admin'?'member':'admin');
    load();
  };

  // Only developer can delete any member; admin can delete members they invited (not other admins); members can delete no one
  const canDelete = (u) => {
    if (u.id === user.id) return false;         // can't delete yourself
    if (u.email === DEVELOPER_EMAIL) return false; // can't delete developer
    return isDev || isAdmin;                    // dev deletes anyone, admin deletes anyone except dev
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    try {
      await usersAPI.delete(deleteConfirm.id);
      setDeleteConfirm(null); load();
    } catch {
      setDeleteConfirm(null);
      alert('Could not delete member. They may have active tasks.');
    }
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><Spinner/></div>;

  return (
    <div>
      <div className="section-head au">
        <div>
          <h1 className="page-title" style={{marginBottom:4}}>Team</h1>
          <p style={{fontSize:14,color:'var(--text-2)'}}>{users.length} members · {users.filter(u=>u.role==='admin').length} admins</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={()=>setInvite(true)}>+ Invite Member</button>}
      </div>

      {/* Summary */}
      <div className="grid-3 au1" style={{marginBottom:'1.5rem'}}>
        {[
          {label:'Total Members', val:users.length,                              color:'#818cf8', icon:'👥'},
          {label:'Admins',        val:users.filter(u=>u.role==='admin').length,  color:'#c4b5fd', icon:'👑'},
          {label:'Members',       val:users.filter(u=>u.role==='member').length, color:'#67e8f9', icon:'👤'},
        ].map(s=>(
          <div key={s.label} className="stat-card" style={{position:'relative'}}>
            <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'var(--grad)'}}/>
            <div style={{position:'absolute',top:'1.2rem',right:'1.2rem',fontSize:22,opacity:0.6}}>{s.icon}</div>
            <div style={{fontFamily:'var(--font-d)',fontSize:36,fontWeight:700,color:s.color}}>{s.val}</div>
            <div style={{fontSize:11,fontWeight:600,textTransform:'uppercase',letterSpacing:'0.08em',color:'var(--text-2)',marginTop:6}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 au2">
        {users.map(u => {
          const uTasks = tasks.filter(t=>t.assignee_id===u.id);
          const done   = uTasks.filter(t=>t.status==='done').length;
          const inProg = uTasks.filter(t=>t.status==='in-progress').length;
          const overdue= uTasks.filter(t=>t.status!=='done'&&t.due_date&&new Date(t.due_date)<new Date()).length;
          const isMe   = u.id === user.id;
          const isDevUser = u.email === DEVELOPER_EMAIL;
          return (
            <div key={u.id} className="card" style={{padding:'1.25rem',cursor:'pointer'}}
              onClick={()=>setExpanded(expanded===u.id?null:u.id)}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1rem'}}>
                <Avatar user={u} size={44}/>
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontFamily:'var(--font-d)',fontSize:15,fontWeight:600}}>{u.name}</span>
                    {isMe && <span style={{fontSize:10,padding:'1px 6px',background:'rgba(99,102,241,0.15)',color:'#818cf8',borderRadius:999,border:'1px solid rgba(99,102,241,0.2)'}}>You</span>}
                    {isDevUser && <span style={{fontSize:10,padding:'1px 6px',background:'rgba(16,185,129,0.15)',color:'#34d399',borderRadius:999,border:'1px solid rgba(16,185,129,0.2)'}}>Developer</span>}
                  </div>
                  <div style={{fontSize:12,color:'var(--text-3)'}}>{u.email}</div>
                </div>
                <Badge role={u.role}/>
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:'0.75rem'}}>
                {[{l:'Total',v:uTasks.length,c:'var(--text)'},{l:'Done',v:done,c:'#34d399'},{l:'Overdue',v:overdue,c:overdue>0?'#f87171':'var(--text-3)'}].map(s=>(
                  <div key={s.l} style={{textAlign:'center',padding:'8px',background:'rgba(255,255,255,0.03)',borderRadius:'var(--r-sm)'}}>
                    <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--font-d)',color:s.c}}>{s.v}</div>
                    <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.l}</div>
                  </div>
                ))}
              </div>

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
                {isAdmin && !isMe && !isDevUser && (
                  <button className="btn btn-sm" onClick={()=>handleRoleToggle(u)} style={{flex:1}}>
                    {u.role==='admin'?'→ Member':'→ Admin'}
                  </button>
                )}
                {canDelete(u) && (
                  <button className="btn btn-sm btn-danger" onClick={()=>setDeleteConfirm({id:u.id,name:u.name})}>
                    🗑 Delete
                  </button>
                )}
              </div>

              {/* Expanded tasks */}
              {expanded===u.id && uTasks.length>0&&(
                <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid var(--border)'}}>
                  <div style={{fontSize:11,fontWeight:600,color:'var(--text-3)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Recent Tasks</div>
                  {uTasks.slice(0,5).map(t=>(
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',fontSize:12}}>
                      <div style={{width:6,height:6,borderRadius:'50%',background:t.status==='done'?'#10b981':t.status==='in-progress'?'#6366f1':'#f59e0b',flexShrink:0}}/>
                      <span style={{flex:1,color:'var(--text-2)'}}>{t.title}</span>
                      <Badge priority={t.priority}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {users.length===0&&<div style={{gridColumn:'1/-1'}}><Empty message="No team members yet."/></div>}
      </div>

      {/* Delete member confirm */}
      {deleteConfirm&&(
        <div className="modal-overlay" onClick={()=>setDeleteConfirm(null)}>
          <div className="modal-box" style={{maxWidth:400,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:48,marginBottom:'1rem'}}>⚠️</div>
            <div style={{fontFamily:'var(--font-d)',fontSize:18,fontWeight:600,marginBottom:8}}>Remove Member?</div>
            <div style={{fontSize:14,color:'var(--text-2)',marginBottom:4}}>
              <strong style={{color:'var(--text)'}}>{deleteConfirm.name}</strong>
            </div>
            <div style={{fontSize:13,color:'var(--text-3)',marginBottom:'1.5rem',lineHeight:1.6}}>
              Are you sure you want to permanently remove this member? Their tasks will remain but they will lose access to the platform.
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
              {err&&<div style={{color:'#f87171',fontSize:12,marginBottom:10}}>{err}</div>}
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button type="button" className="btn" onClick={()=>setInvite(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
