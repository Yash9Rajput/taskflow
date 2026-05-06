import React, { useState, useEffect } from 'react';
import { usersAPI, tasksAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, ProgressBar, Spinner, Empty, DonutChart } from '../components/UI';

export default function Team() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [users,  setUsers]  = useState([]);
  const [tasks,  setTasks]  = useState([]);
  const [loading,setLoading]= useState(true);
  const [invite, setInvite] = useState(false);
  const [form,   setForm]   = useState({name:'',email:'',password:'',role:'member'});
  const [err,    setErr]    = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = () => {
    Promise.all([usersAPI.list(), tasksAPI.list()])
      .then(([u,t])=>{setUsers(u.data);setTasks(t.data);})
      .finally(()=>setLoading(false));
  };
  useEffect(()=>{load();},[]);

  const handleInvite = async(e) => {
    e.preventDefault(); setErr('');
    try {
      await usersAPI.invite(form);
      setInvite(false); setForm({name:'',email:'',password:'',role:'member'}); load();
    } catch(er){ setErr(er.response?.data?.error||'Failed'); }
  };

  const handleRoleToggle = async(u) => {
    await usersAPI.updateRole(u.id, u.role==='admin'?'member':'admin');
    load();
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><Spinner /></div>;

  return (
    <div>
      <div className="page-bg" />
      <div className="section-head animate-up">
        <div>
          <h1 className="page-title" style={{marginBottom:4}}>Team</h1>
          <p style={{fontSize:14,color:'var(--text-secondary)'}}>{users.length} members · {users.filter(u=>u.role==='admin').length} admins</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={()=>setInvite(true)}>+ Invite Member</button>}
      </div>

      {/* Summary cards */}
      <div className="grid-3 animate-up-1" style={{marginBottom:'1.5rem'}}>
        {[
          {label:'Total Members',  val:users.length,                              color:'#818cf8', icon:'👥'},
          {label:'Admins',         val:users.filter(u=>u.role==='admin').length,  color:'#a78bfa', icon:'👑'},
          {label:'Active Members', val:users.filter(u=>u.role==='member').length, color:'#67e8f9', icon:'⚡'},
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <span className="stat-icon">{s.icon}</span>
            <div className="stat-num" style={{color:s.color}}>{s.val}</div>
            <div className="stat-lbl">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Member cards */}
      <div className="grid-2 animate-up-2">
        {users.map(u => {
          const uTasks = tasks.filter(t=>t.assignee_id===u.id);
          const done   = uTasks.filter(t=>t.status==='done').length;
          const inProg = uTasks.filter(t=>t.status==='in-progress').length;
          const overdue= uTasks.filter(t=>t.status!=='done'&&t.due_date&&new Date(t.due_date)<new Date()).length;
          const isExpanded = expanded === u.id;
          return (
            <div key={u.id} className="card" style={{padding:'1.25rem',cursor:'pointer'}} onClick={()=>setExpanded(isExpanded?null:u.id)}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:'1rem'}}>
                <Avatar user={u} size={44} />
                <div style={{flex:1}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <span style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600}}>{u.name}</span>
                    {u.id===user.id && <span style={{fontSize:10,padding:'1px 6px',background:'rgba(99,102,241,0.15)',color:'#818cf8',borderRadius:999,border:'1px solid rgba(99,102,241,0.2)'}}>You</span>}
                  </div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{u.email}</div>
                </div>
                <Badge role={u.role} />
                {isAdmin && u.id!==user.id && (
                  <button className="btn btn-sm" onClick={e=>{e.stopPropagation();handleRoleToggle(u);}}>
                    {u.role==='admin'?'→ Member':'→ Admin'}
                  </button>
                )}
              </div>

              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:'0.75rem'}}>
                {[
                  {label:'Total',   val:uTasks.length, color:'var(--text-primary)'},
                  {label:'Done',    val:done,           color:'#34d399'},
                  {label:'Overdue', val:overdue,        color:overdue>0?'#f87171':'var(--text-muted)'},
                ].map(s=>(
                  <div key={s.label} style={{textAlign:'center',padding:'8px',background:'rgba(255,255,255,0.03)',borderRadius:'var(--radius-sm)'}}>
                    <div style={{fontSize:18,fontWeight:700,fontFamily:'var(--font-display)',color:s.color}}>{s.val}</div>
                    <div style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:11,color:'var(--text-muted)',marginBottom:4}}>
                    <span>Completion</span>
                    <span>{uTasks.length?Math.round(done/uTasks.length*100):0}%</span>
                  </div>
                  <ProgressBar value={done} max={uTasks.length} />
                </div>
                {uTasks.length > 0 && (
                  <DonutChart size={50} thickness={8} segments={[
                    {value:done,    color:'#10b981'},
                    {value:inProg,  color:'#6366f1'},
                    {value:overdue, color:'#ef4444'},
                    {value:Math.max(0,uTasks.length-done-inProg-overdue), color:'rgba(255,255,255,0.06)'},
                  ].filter(s=>s.value>0)} />
                )}
              </div>

              {isExpanded && uTasks.length > 0 && (
                <div style={{marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid var(--border)'}}>
                  <div style={{fontSize:12,fontWeight:600,color:'var(--text-secondary)',marginBottom:8,textTransform:'uppercase',letterSpacing:'0.05em'}}>Recent Tasks</div>
                  {uTasks.slice(0,4).map(t=>(
                    <div key={t.id} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',fontSize:12}}>
                      <div style={{width:6,height:6,borderRadius:'50%',background:t.status==='done'?'#10b981':t.status==='in-progress'?'#6366f1':'#f59e0b',flexShrink:0}} />
                      <span style={{flex:1,color:'var(--text-secondary)'}}>{t.title}</span>
                      <Badge priority={t.priority} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {users.length===0 && <div style={{gridColumn:'1/-1'}}><Empty message="No team members yet." /></div>}
      </div>

      {/* Invite modal */}
      {invite && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setInvite(false)}>
          <div className="modal-box">
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
              <div className="modal-title" style={{margin:0}}>Invite Team Member</div>
              <button className="btn btn-sm" onClick={()=>setInvite(false)}>✕</button>
            </div>
            <form onSubmit={handleInvite}>
              {[{k:'name',l:'Full Name',t:'text',p:'Their name'},{k:'email',l:'Email',t:'email',p:'email@example.com'},{k:'password',l:'Temp Password',t:'password',p:'Min 6 characters'}].map(f=>(
                <div className="field" key={f.k}>
                  <label>{f.l}</label>
                  <input type={f.t} placeholder={f.p} value={form[f.k]} onChange={e=>setForm(prev=>({...prev,[f.k]:e.target.value}))} required />
                </div>
              ))}
              <div className="field">
                <label>Role</label>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                  {['member','admin'].map(r=>(
                    <div key={r} onClick={()=>setForm(prev=>({...prev,role:r}))}
                      style={{padding:'8px',borderRadius:'var(--radius-sm)',border:`1px solid ${form.role===r?'var(--accent)':'var(--border)'}`,background:form.role===r?'rgba(99,102,241,0.1)':'transparent',cursor:'pointer',textAlign:'center',fontSize:13,fontWeight:500,color:form.role===r?'#818cf8':'var(--text-secondary)',textTransform:'capitalize'}}>
                      {r==='admin'?'👑':'👤'} {r}
                    </div>
                  ))}
                </div>
              </div>
              {err && <div style={{color:'#f87171',fontSize:12,marginBottom:10}}>{err}</div>}
              <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'0.5rem'}}>
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
