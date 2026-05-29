import React, { useState, useEffect } from 'react';
import { projectsAPI, tasksAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, ProgressBar, Spinner, Empty, taskStatusDisplay, DonutChart } from '../components/UI';
import ProjectModal    from '../components/ProjectModal';
import TaskModal       from '../components/TaskModal';
import TaskDetailModal from '../components/TaskDetailModal';

const DEV_EMAILS = ['ry1555530@gmail.com','rajput.kyar@gmail.com'];

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
  const [showPM,   setShowPM]   = useState(false);
  const [editProj, setEditProj] = useState(null);
  const [showTM,   setShowTM]   = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [taskFilter, setTaskFilter] = useState('all');

  const load = () => {
    Promise.all([projectsAPI.list(), usersAPI.list()])
      .then(([p,u]) => { setProjects(p.data); setUsers(u.data); })
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

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === 'project') { await projectsAPI.delete(deleteConfirm.id); setSelected(null); load(); }
      else { await tasksAPI.delete(deleteConfirm.id); loadTasks(selected); }
    } finally { setDeleteConfirm(null); }
  };

  const filteredProjects = projects.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const taskCounts = {
    all: projTasks.length,
    todo: projTasks.filter(t=>t.status==='todo').length,
    'in-progress': projTasks.filter(t=>t.status==='in-progress').length,
    done: projTasks.filter(t=>t.status==='done').length,
    overdue: projTasks.filter(t=>t.status!=='done'&&t.due_date&&new Date(t.due_date)<new Date()).length,
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><Spinner/></div>;

  return (
    <div style={{overflowY:'auto'}}>
      <div className="section-head au">
        <div>
          <h1 className="page-title" style={{marginBottom:4}}>Projects</h1>
          <p style={{fontSize:14,color:'var(--text-2)'}}>{projects.length} projects</p>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="🔍 Search projects…" style={{fontSize:13,minWidth:200}}/>
          {isAdmin && <button className="btn btn-primary" onClick={()=>{setEditProj(null);setShowPM(true);}}>+ New Project</button>}
        </div>
      </div>

      {/* Project cards */}
      <div className="grid-3 au1" style={{marginBottom:'1.5rem'}}>
        {filteredProjects.map(p => {
          const pct   = p.task_stats?.total ? Math.round(p.task_stats.done/p.task_stats.total*100) : 0;
          const total = p.task_stats?.total || 0;
          const done  = p.task_stats?.done  || 0;
          const isSel = selected === p.id;
          return (
            <div key={p.id} className={`card card-hover ${isSel?'card-selected':''}`}
              style={{padding:'1.5rem',cursor:'pointer',position:'relative',overflow:'hidden'}}
              onClick={() => { setSelected(isSel ? null : p.id); setTaskFilter('all'); }}>
              {isSel && <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'var(--grad)'}}/>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.75rem'}}>
                <div style={{width:42,height:42,borderRadius:'var(--r-sm)',background:'rgba(99,102,241,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
                  {['📁','🚀','💡','🎯','⚙️','🌟','🔥','💎'][p.name.charCodeAt(0)%8]}
                </div>
                <div style={{display:'flex',gap:4}} onClick={e=>e.stopPropagation()}>
                  {isAdmin && <button className="btn btn-sm" onClick={()=>{setEditProj(p);setShowPM(true);}}>✎</button>}
                  {canDeleteProject(p) && <button className="btn btn-sm btn-danger" onClick={()=>setDeleteConfirm({id:p.id,type:'project',name:p.name})}>🗑</button>}
                </div>
              </div>
              <div style={{fontFamily:'var(--font-d)',fontSize:15,fontWeight:600,marginBottom:4}}>{p.name}</div>
              <div style={{fontSize:12,color:'var(--text-3)',marginBottom:'0.75rem',lineHeight:1.5}}>{p.description||'No description'}</div>
              <div style={{display:'flex',gap:4,marginBottom:'0.75rem',alignItems:'center'}}>
                {(p.members||[]).slice(0,5).map((m,i)=>(
                  <div key={m.id||i} style={{marginLeft:i?-6:0}} title={m.name}><Avatar user={m} size={24}/></div>
                ))}
                {(p.members||[]).length>5 && <span style={{fontSize:10,color:'var(--text-3)',marginLeft:4}}>+{p.members.length-5}</span>}
                {(p.members||[]).length===0 && <span style={{fontSize:11,color:'var(--text-3)'}}>No members</span>}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-3)',marginBottom:6}}>
                <span>{total} tasks</span>
                <span style={{fontWeight:600,color:pct===100?'#34d399':'var(--text-2)'}}>{pct}%</span>
              </div>
              <ProgressBar value={done} max={total}/>
              {isSel && <div style={{marginTop:10,fontSize:11,color:'#a5b4fc',textAlign:'center'}}>▼ See tasks & team below</div>}
            </div>
          );
        })}
        {filteredProjects.length===0 && <div style={{gridColumn:'1/-1'}}><Empty message={search?"No projects match your search.":"No projects yet."}/></div>}
      </div>

      {/* Expanded project detail */}
      {selected && selProject && (
        <div className="card au" style={{padding:'1.5rem',marginBottom:'1.5rem'}}>
          {/* Header */}
          <div style={{display:'flex',alignItems:'flex-start',gap:'1.5rem',marginBottom:'1.5rem',flexWrap:'wrap'}}>
            <div style={{flex:1,minWidth:200}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
                <div style={{width:36,height:36,borderRadius:'var(--r-sm)',background:'rgba(99,102,241,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                  {['📁','🚀','💡','🎯','⚙️','🌟','🔥','💎'][selProject.name.charCodeAt(0)%8]}
                </div>
                <div>
                  <div style={{fontFamily:'var(--font-d)',fontSize:18,fontWeight:700}}>{selProject.name}</div>
                  <div style={{fontSize:12,color:'var(--text-3)'}}>{selProject.description||'No description'}</div>
                </div>
              </div>
            </div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {[
                {l:'Total',  v:projTasks.length,                                                                           c:'#818cf8'},
                {l:'Done',   v:projTasks.filter(t=>t.status==='done').length,                                              c:'#34d399'},
                {l:'Active', v:projTasks.filter(t=>t.status==='in-progress').length,                                       c:'#fbbf24'},
                {l:'Overdue',v:projTasks.filter(t=>t.status!=='done'&&t.due_date&&new Date(t.due_date)<new Date()).length,  c:'#f87171'},
              ].map(s=>(
                <div key={s.l} style={{textAlign:'center',padding:'10px 16px',background:'rgba(255,255,255,0.03)',borderRadius:'var(--r-md)',border:'1px solid var(--border)',minWidth:70}}>
                  <div style={{fontSize:22,fontWeight:700,fontFamily:'var(--font-d)',color:s.c}}>{s.v}</div>
                  <div style={{fontSize:10,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.07em',marginTop:4}}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Team members */}
          {(selProject.members||[]).length > 0 && (
            <div style={{marginBottom:'1.5rem',padding:'1rem',background:'rgba(99,102,241,0.05)',borderRadius:'var(--r-md)',border:'1px solid rgba(99,102,241,0.12)'}}>
              <div style={{fontSize:12,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em',marginBottom:10}}>👥 Team Members</div>
              <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                {selProject.members.map(m => {
                  const mt = projTasks.filter(t=>t.assignee_id===m.id);
                  const md = mt.filter(t=>t.status==='done').length;
                  return (
                    <div key={m.id} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'rgba(255,255,255,0.04)',borderRadius:'var(--r-sm)',border:'1px solid var(--border)'}}>
                      <Avatar user={m} size={28}/>
                      <div>
                        <div style={{fontSize:12,fontWeight:500}}>{m.name}</div>
                        <div style={{fontSize:10,color:'var(--text-3)'}}>{mt.length} tasks · {md} done</div>
                      </div>
                      <Badge role={m.role}/>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Task list */}
          <div className="section-head" style={{marginBottom:'1rem'}}>
            <div>
              <div className="section-title">Tasks</div>
              <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>Click any task to view details</div>
            </div>
            {isAdmin && <button className="btn btn-primary btn-sm" onClick={()=>{setEditTask(null);setShowTM(true);}}>+ Add Task</button>}
          </div>

          {/* Task filters */}
          <div style={{display:'flex',gap:6,marginBottom:'1.25rem',flexWrap:'wrap'}}>
            {[{k:'all',color:'#818cf8',l:'All'},{k:'todo',color:'#6366f1',l:'To Do'},{k:'in-progress',color:'#fbbf24',l:'In Progress'},{k:'done',color:'#34d399',l:'Done'},{k:'overdue',color:'#f87171',l:'Overdue'}].map(({k,color,l})=>(
              <button key={k} onClick={()=>setTaskFilter(k)}
                style={{padding:'4px 12px',borderRadius:999,border:`1px solid ${taskFilter===k?color:'var(--border)'}`,background:taskFilter===k?`${color}18`:'transparent',fontSize:12,fontWeight:500,color:taskFilter===k?color:'var(--text-3)',cursor:'pointer',transition:'all 0.15s'}}>
                {l} <strong>{taskCounts[k]}</strong>
              </button>
            ))}
          </div>

          {filteredTasks.length===0 ? <Empty message="No tasks match this filter."/> : filteredTasks.map(t => {
            const assignee  = users.find(u=>u.id===t.assignee_id);
            const canEdit   = isAdmin || t.assignee_id===user.id;
            const isOverdue = t.status!=='done'&&t.due_date&&new Date(t.due_date)<new Date();
            return (
              <div key={t.id}>
                <div className="task-row" style={{cursor:'pointer'}} onClick={()=>setViewTask(t)}>
                  <Avatar user={assignee||{name:'?'}} size={32}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500}}>{t.title}</div>
                    <div style={{fontSize:11,color:'var(--text-3)'}}>
                      {assignee?.name||'Unassigned'} · {isOverdue
                        ? <span style={{color:'#f87171'}}>⚠ Overdue: {t.due_date}</span>
                        : (t.due_date||'No due date')}
                    </div>
                  </div>
                  <Badge priority={t.priority}/>
                  <Badge status={taskStatusDisplay(t)}/>
                  <span style={{fontSize:11,color:'var(--text-3)',padding:'3px 8px',borderRadius:6,border:'1px solid var(--border)'}}>View →</span>
                  {canEdit && <button className="btn btn-sm" onClick={e=>{e.stopPropagation();setEditTask(t);setShowTM(true);}}>✎</button>}
                  {canDeleteTask(t) && <button className="btn btn-sm btn-danger" onClick={e=>{e.stopPropagation();setDeleteConfirm({id:t.id,type:'task',name:t.title});}}>✕</button>}
                </div>
                <div className="task-divider"/>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={()=>setDeleteConfirm(null)}>
          <div className="modal-box" style={{maxWidth:400,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:48,marginBottom:'1rem'}}>⚠️</div>
            <div style={{fontFamily:'var(--font-d)',fontSize:18,fontWeight:600,marginBottom:8}}>Delete {deleteConfirm.type==='project'?'Project':'Task'}?</div>
            <div style={{fontSize:14,color:'var(--text-2)',marginBottom:4}}><strong>&ldquo;{deleteConfirm.name}&rdquo;</strong></div>
            <div style={{fontSize:13,color:'var(--text-3)',marginBottom:'1.5rem',lineHeight:1.6}}>
              {deleteConfirm.type==='project'?'Permanently deletes the project and all its tasks.':'Permanently deletes this task.'}
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="btn" onClick={()=>setDeleteConfirm(null)} style={{minWidth:100}}>No, Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirmed} style={{minWidth:100}}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {viewTask && <TaskDetailModal task={viewTask} users={users} projects={projects} onClose={()=>setViewTask(null)} onEdit={t=>{setEditTask(t);setViewTask(null);setShowTM(true);}}/>}
      {showPM && <ProjectModal project={editProj} users={users} onClose={()=>{setShowPM(false);setEditProj(null);}} onSaved={()=>{load();setShowPM(false);setEditProj(null);}}/>}
      {showTM && <TaskModal task={editTask} projects={projects} users={users} defaultProjectId={selected} onClose={()=>{setShowTM(false);setEditTask(null);}} onSaved={()=>{if(selected)loadTasks(selected);setShowTM(false);setEditTask(null);}}/>}
    </div>
  );
}
