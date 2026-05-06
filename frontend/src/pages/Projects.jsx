import React, { useState, useEffect } from 'react';
import { projectsAPI, tasksAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, ProgressBar, Spinner, Empty, taskStatusDisplay } from '../components/UI';
import ProjectModal from '../components/ProjectModal';
import TaskModal from '../components/TaskModal';

export default function Projects() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [projects, setProjects] = useState([]);
  const [tasks,    setTasks]    = useState([]);
  const [users,    setUsers]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showPM,   setShowPM]   = useState(false);
  const [editProj, setEditProj] = useState(null);
  const [showTM,   setShowTM]   = useState(false);
  const [editTask, setEditTask] = useState(null);

  const load = () => {
    Promise.all([projectsAPI.list(), usersAPI.list()])
      .then(([p,u]) => { setProjects(p.data); setUsers(u.data); })
      .finally(() => setLoading(false));
  };

  const loadTasks = (pid) => {
    tasksAPI.list({ projectId: pid }).then(r => setTasks(r.data));
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { if (selected) loadTasks(selected); else setTasks([]); }, [selected]);

  const selProject = projects.find(p => p.id === selected);
  const projTasks  = tasks.filter(t => t.project_id === selected);

  const statusColors = { todo:'#6366f1','in-progress':'#f59e0b', done:'#10b981', overdue:'#ef4444' };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><Spinner /></div>;

  return (
    <div>
      <div className="page-bg" />
      <div className="section-head animate-up">
        <div>
          <h1 className="page-title" style={{marginBottom:4}}>Projects</h1>
          <p style={{fontSize:14,color:'var(--text-secondary)'}}>{projects.length} active projects</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditProj(null); setShowPM(true); }}>
            + New Project
          </button>
        )}
      </div>

      <div className="grid-3 animate-up-1" style={{marginBottom:'1.5rem'}}>
        {projects.map(p => {
          const pct = p.total_tasks ? Math.round(p.done_tasks/p.total_tasks*100) : 0;
          const members = (p.members||[]).slice(0,4);
          const isSelected = selected === p.id;
          return (
            <div key={p.id} className="card card-interactive"
              onClick={() => setSelected(isSelected ? null : p.id)}
              style={{padding:'1.5rem',cursor:'pointer',position:'relative',overflow:'hidden',
                borderColor: isSelected ? 'rgba(99,102,241,0.5)' : undefined,
                background: isSelected ? 'rgba(99,102,241,0.05)' : undefined}}>
              {isSelected && <div style={{position:'absolute',top:0,left:0,right:0,height:2,background:'var(--gradient)'}} />}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.75rem'}}>
                <div style={{width:40,height:40,borderRadius:'var(--radius-sm)',background:'rgba(99,102,241,0.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>
                  {['📁','🚀','💡','🎯','⚙️','🌟'][p.name.charCodeAt(0)%6]}
                </div>
                {isAdmin && (
                  <button className="btn btn-sm" onClick={e=>{e.stopPropagation();setEditProj(p);setShowPM(true);}}>✎</button>
                )}
              </div>
              <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:600,marginBottom:4}}>{p.name}</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:'1rem',lineHeight:1.5}}>{p.description||'No description'}</div>
              <div style={{display:'flex',gap:-6,marginBottom:'0.75rem'}}>
                {members.map((m,i)=>(
                  <div key={m.id||i} style={{marginLeft:i===0?0:-8}}>
                    <Avatar user={m} size={24} />
                  </div>
                ))}
                {(p.members||[]).length>4 && <div style={{width:24,height:24,borderRadius:'50%',background:'rgba(255,255,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:'var(--text-muted)',marginLeft:-8}}>+{p.members.length-4}</div>}
              </div>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--text-muted)',marginBottom:6}}>
                <span>{p.total_tasks||0} tasks</span>
                <span style={{fontWeight:600,color:pct===100?'#34d399':'var(--text-secondary)'}}>{pct}%</span>
              </div>
              <ProgressBar value={p.done_tasks||0} max={p.total_tasks||0} />
            </div>
          );
        })}
        {projects.length === 0 && <div style={{gridColumn:'1/-1'}}><Empty message="No projects yet. Create your first one!" /></div>}
      </div>

      {/* Task detail panel */}
      {selected && selProject && (
        <div className="card animate-up" style={{padding:'1.5rem'}}>
          <div className="section-head">
            <div>
              <div className="section-title">{selProject.name}</div>
              <div style={{fontSize:12,color:'var(--text-muted)',marginTop:2}}>{projTasks.length} tasks</div>
            </div>
            {isAdmin && (
              <button className="btn btn-primary btn-sm" onClick={()=>{setEditTask(null);setShowTM(true);}}>+ Add Task</button>
            )}
          </div>

          {/* Status summary pills */}
          <div style={{display:'flex',gap:8,marginBottom:'1.25rem',flexWrap:'wrap'}}>
            {Object.entries({todo:'To Do','in-progress':'In Progress',done:'Done'}).map(([k,label])=>{
              const count = projTasks.filter(t=>t.status===k).length;
              return (
                <div key={k} style={{padding:'4px 12px',borderRadius:999,background:`rgba(${k==='todo'?'99,102,241':k==='in-progress'?'245,158,11':'16,185,129'},0.12)`,border:`1px solid rgba(${k==='todo'?'99,102,241':k==='in-progress'?'245,158,11':'16,185,129'},0.2)`,fontSize:12,fontWeight:500,color:statusColors[k]}}>
                  {label}: {count}
                </div>
              );
            })}
          </div>

          {projTasks.length === 0 ? <Empty message="No tasks in this project." /> : projTasks.map(t => {
            const assignee = users.find(u=>u.id===t.assignee_id);
            const canEdit = isAdmin || t.assignee_id === user.id;
            return (
              <div key={t.id} className="task-row">
                <Avatar user={assignee||{name:'?'}} size={32} />
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500}}>{t.title}</div>
                  <div style={{fontSize:11,color:'var(--text-muted)'}}>{assignee?.name||'Unassigned'} · {t.due_date||'No due date'}</div>
                </div>
                <Badge priority={t.priority} />
                <Badge status={taskStatusDisplay(t)} />
                {canEdit && <button className="btn btn-sm" onClick={()=>{setEditTask(t);setShowTM(true);}}>✎</button>}
                {isAdmin && <button className="btn btn-sm btn-danger" onClick={async()=>{await tasksAPI.delete(t.id);loadTasks(selected);}}>✕</button>}
              </div>
            );
          })}
        </div>
      )}

      {showPM && (
        <ProjectModal project={editProj} users={users}
          onClose={()=>{setShowPM(false);setEditProj(null);}}
          onSaved={()=>{load();setShowPM(false);setEditProj(null);}} />
      )}
      {showTM && (
        <TaskModal task={editTask} projects={projects} users={users} defaultProjectId={selected}
          onClose={()=>{setShowTM(false);setEditTask(null);}}
          onSaved={()=>{loadTasks(selected);setShowTM(false);setEditTask(null);}} />
      )}
    </div>
  );
}
