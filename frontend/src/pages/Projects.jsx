import React, { useState, useEffect } from 'react';
import { projectsAPI, tasksAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, ProgressBar, Spinner, Empty, taskStatusDisplay } from '../components/UI';
import ProjectModal    from '../components/ProjectModal';
import TaskModal       from '../components/TaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import { DEVELOPER_EMAIL } from '../App';

export default function Projects() {
  const { user } = useAuth();
  const isAdmin   = user?.role === 'admin';
  const isDev     = user?.email === DEVELOPER_EMAIL; // developer can delete anything

  const [projects, setProjects] = useState([]);
  const [tasks,    setTasks]    = useState([]);
  const [users,    setUsers]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showPM,   setShowPM]   = useState(false);
  const [editProj, setEditProj] = useState(null);
  const [showTM,   setShowTM]   = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id, type, name }

  const load = () => {
    Promise.all([projectsAPI.list(), usersAPI.list()])
      .then(([p,u]) => { setProjects(p.data); setUsers(u.data); })
      .finally(() => setLoading(false));
  };
  const loadTasks = (pid) => tasksAPI.list({ projectId: pid }).then(r => setTasks(r.data));

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selected) loadTasks(selected); else setTasks([]); }, [selected]);

  const selProject = projects.find(p => p.id === selected);
  const projTasks  = tasks.filter(t => t.project_id === selected);

  // Can delete project: developer always, admin only their own
  const canDeleteProject = (p) => isDev || (isAdmin && p.created_by === user.id);
  // Can delete task: developer always, admin only tasks in their projects
  const canDeleteTask = (t) => isDev || (isAdmin && t.created_by === user.id);

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
    } finally { setDeleteConfirm(null); }
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><Spinner/></div>;

  return (
    <div>
      <div className="section-head au">
        <div>
          <h1 className="page-title" style={{marginBottom:4}}>Projects</h1>
          <p style={{fontSize:14,color:'var(--text-2)'}}>{projects.length} projects</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={()=>{setEditProj(null);setShowPM(true);}}>+ New Project</button>}
      </div>

      <div className="grid-3 au1" style={{marginBottom:'1.5rem'}}>
        {projects.map(p => {
          const pct = p.total_tasks ? Math.round(p.done_tasks/p.total_tasks*100) : 0;
          const isSel = selected === p.id;
          return (
            <div key={p.id} className={`card card-hover ${isSel?'card-selected':''}`}
              style={{padding:'1.5rem',cursor:'pointer',position:'relative',overflow:'hidden'}}
              onClick={() => setSelected(isSel ? null : p.id)}>
              {isSel && <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'var(--grad)'}}/>}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.75rem'}}>
                <div style={{width:42,height:42,borderRadius:'var(--r-sm)',background:'rgba(99,102,241,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>
                  {['📁','🚀','💡','🎯','⚙️','🌟','🔥','💎'][p.name.charCodeAt(0)%8]}
                </div>
                <div style={{display:'flex',gap:4}} onClick={e=>e.stopPropagation()}>
                  {isAdmin && <button className="btn btn-sm" onClick={()=>{setEditProj(p);setShowPM(true);}}>✎</button>}
                  {canDeleteProject(p) && (
                    <button className="btn btn-sm btn-danger"
                      onClick={()=>setDeleteConfirm({id:p.id,type:'project',name:p.name})}>🗑</button>
                  )}
                </div>
              </div>
              <div style={{fontFamily:'var(--font-d)',fontSize:15,fontWeight:600,marginBottom:4}}>{p.name}</div>
              <div style={{fontSize:12,color:'var(--text-3)',marginBottom:'1rem',lineHeight:1.5}}>{p.description||'No description'}</div>
              <div style={{display:'flex',gap:4,marginBottom:'0.75rem'}}>
                {(p.members||[]).slice(0,5).map((m,i)=>(
                  <div key={m.id||i} style={{marginLeft:i?-6:0}}><Avatar user={m} size={24}/></div>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-3)',marginBottom:6}}>
                <span>{p.total_tasks||0} tasks</span>
                <span style={{fontWeight:600,color:pct===100?'#34d399':'var(--text-2)'}}>{pct}%</span>
              </div>
              <ProgressBar value={p.done_tasks||0} max={p.total_tasks||0}/>
            </div>
          );
        })}
        {projects.length===0 && <div style={{gridColumn:'1/-1'}}><Empty message="No projects yet."/></div>}
      </div>

      {/* Task panel */}
      {selected && selProject && (
        <div className="card au" style={{padding:'1.5rem'}}>
          <div className="section-head">
            <div>
              <div className="section-title">{selProject.name} — Tasks</div>
              <div style={{fontSize:12,color:'var(--text-3)',marginTop:2}}>{projTasks.length} tasks · click any task to view details</div>
            </div>
            {isAdmin && <button className="btn btn-primary btn-sm" onClick={()=>{setEditTask(null);setShowTM(true);}}>+ Add Task</button>}
          </div>
          <div style={{display:'flex',gap:8,marginBottom:'1.25rem',flexWrap:'wrap'}}>
            {[['todo','#818cf8','To Do'],['in-progress','#fbbf24','In Progress'],['done','#34d399','Done']].map(([k,c,l])=>(
              <div key={k} style={{padding:'3px 12px',borderRadius:999,background:`${c}18`,border:`1px solid ${c}33`,fontSize:12,fontWeight:500,color:c}}>
                {l}: {projTasks.filter(t=>t.status===k).length}
              </div>
            ))}
          </div>
          {projTasks.length===0 ? <Empty message="No tasks in this project."/> : projTasks.map(t => {
            const assignee = users.find(u=>u.id===t.assignee_id);
            const canEdit  = isAdmin || t.assignee_id===user.id;
            return (
              <div key={t.id}>
                <div className="task-row" style={{cursor:'pointer'}} onClick={()=>setViewTask(t)}>
                  <Avatar user={assignee||{name:'?'}} size={32}/>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,fontWeight:500}}>{t.title}</div>
                    <div style={{fontSize:11,color:'var(--text-3)'}}>{assignee?.name||'Unassigned'} · {t.due_date||'No due date'}</div>
                  </div>
                  <Badge priority={t.priority}/>
                  <Badge status={taskStatusDisplay(t)}/>
                  <span style={{fontSize:11,color:'var(--text-3)',padding:'3px 8px',borderRadius:6,border:'1px solid var(--border)'}}>View →</span>
                  {canEdit && <button className="btn btn-sm" onClick={e=>{e.stopPropagation();setEditTask(t);setShowTM(true);}}>✎</button>}
                  {canDeleteTask(t) && (
                    <button className="btn btn-sm btn-danger"
                      onClick={e=>{e.stopPropagation();setDeleteConfirm({id:t.id,type:'task',name:t.title});}}>✕</button>
                  )}
                </div>
                <div className="task-divider"/>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm delete modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={()=>setDeleteConfirm(null)}>
          <div className="modal-box" style={{maxWidth:400,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:48,marginBottom:'1rem'}}>⚠️</div>
            <div style={{fontFamily:'var(--font-d)',fontSize:18,fontWeight:600,marginBottom:8}}>
              Delete {deleteConfirm.type==='project'?'Project':'Task'}?
            </div>
            <div style={{fontSize:14,color:'var(--text-2)',marginBottom:4}}>
              <strong style={{color:'var(--text)'}}>&ldquo;{deleteConfirm.name}&rdquo;</strong>
            </div>
            <div style={{fontSize:13,color:'var(--text-3)',marginBottom:'1.5rem',lineHeight:1.6}}>
              {deleteConfirm.type==='project'
                ? 'This will permanently delete the project and all its tasks. This cannot be undone.'
                : 'This will permanently delete this task. This cannot be undone.'}
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
      {showTM && <TaskModal task={editTask} projects={projects} users={users} defaultProjectId={selected} onClose={()=>{setShowTM(false);setEditTask(null);}} onSaved={()=>{loadTasks(selected);setShowTM(false);setEditTask(null);}}/>}
    </div>
  );
}
