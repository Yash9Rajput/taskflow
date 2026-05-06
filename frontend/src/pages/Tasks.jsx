import React, { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, Spinner, Empty, taskStatusDisplay } from '../components/UI';
import TaskModal from '../components/TaskModal';

const TABS = [
  { key:'all',         label:'All',         color:'#818cf8' },
  { key:'todo',        label:'To Do',       color:'#6366f1' },
  { key:'in-progress', label:'In Progress', color:'#f59e0b' },
  { key:'done',        label:'Done',        color:'#10b981' },
  { key:'overdue',     label:'Overdue',     color:'#ef4444' },
];

export default function Tasks() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [tasks,    setTasks]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [tab,      setTab]      = useState('all');
  const [loading,  setLoading]  = useState(true);
  const [showTM,   setShowTM]   = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [search,   setSearch]   = useState('');

  const load = () => {
    Promise.all([tasksAPI.list(), projectsAPI.list(), usersAPI.list()])
      .then(([t,p,u]) => { setTasks(t.data); setProjects(p.data); setUsers(u.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const now = new Date();
  const filtered = tasks.filter(t => {
    const isOverdue = t.status !== 'done' && t.due_date && new Date(t.due_date) < now;
    const matchTab = tab === 'all' ? true : tab === 'overdue' ? isOverdue : (t.status === tab && !isOverdue);
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    all: tasks.length,
    todo: tasks.filter(t=>t.status==='todo').length,
    'in-progress': tasks.filter(t=>t.status==='in-progress').length,
    done: tasks.filter(t=>t.status==='done').length,
    overdue: tasks.filter(t=>t.status!=='done'&&t.due_date&&new Date(t.due_date)<now).length,
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><Spinner /></div>;

  return (
    <div>
      <div className="page-bg" />
      <div className="section-head animate-up">
        <div>
          <h1 className="page-title" style={{marginBottom:4}}>Tasks</h1>
          <p style={{fontSize:14,color:'var(--text-secondary)'}}>{tasks.length} total tasks across all projects</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={()=>{setEditTask(null);setShowTM(true);}}>+ New Task</button>
        )}
      </div>

      {/* Tabs + search */}
      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1.25rem',flexWrap:'wrap'}} className="animate-up-1">
        <div className="tabs">
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>
              {t.label}
              <span style={{marginLeft:5,padding:'1px 7px',borderRadius:999,fontSize:11,background:tab===t.key?`rgba(${t.key==='overdue'?'239,68,68':t.key==='done'?'16,185,129':t.key==='in-progress'?'245,158,11':'99,102,241'},0.2)`:'rgba(255,255,255,0.06)',color:tab===t.key?t.color:'var(--text-muted)'}}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
        <div style={{flex:1,minWidth:200,maxWidth:300}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Search tasks…" style={{fontSize:13}} />
        </div>
      </div>

      {/* Task list */}
      <div className="card animate-up-2" style={{padding:'0.5rem 1.5rem'}}>
        {/* Header */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 120px 80px 100px 90px',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)',marginBottom:4}}>
          {['Task','Assignee','Priority','Status','Actions'].map(h=>(
            <div key={h} style={{fontSize:11,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{h}</div>
          ))}
        </div>
        {filtered.length === 0 ? <Empty message={`No ${tab} tasks found.`} /> : filtered.map(t => {
          const assignee = users.find(u=>u.id===t.assignee_id);
          const proj = projects.find(p=>p.id===t.project_id);
          const canEdit = isAdmin || t.assignee_id === user.id;
          const isOverdue = t.status!=='done'&&t.due_date&&new Date(t.due_date)<now;
          return (
            <div key={t.id} style={{display:'grid',gridTemplateColumns:'1fr 120px 80px 100px 90px',gap:12,padding:'12px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',alignItems:'center',transition:'background 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{t.title}</div>
                <div style={{fontSize:11,color:'var(--text-muted)'}}>{proj?.name||'—'} · {isOverdue?<span style={{color:'#f87171'}}>Overdue: {t.due_date}</span>:(t.due_date||'No due date')}</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <Avatar user={assignee||{name:'?'}} size={24} />
                <span style={{fontSize:12,color:'var(--text-secondary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{assignee?.name?.split(' ')[0]||'—'}</span>
              </div>
              <Badge priority={t.priority} />
              <Badge status={taskStatusDisplay(t)} />
              <div style={{display:'flex',gap:4}}>
                {canEdit && <button className="btn btn-sm" onClick={()=>{setEditTask(t);setShowTM(true);}}>✎</button>}
                {isAdmin && <button className="btn btn-sm btn-danger" onClick={async()=>{await tasksAPI.delete(t.id);load();}}>✕</button>}
              </div>
            </div>
          );
        })}
      </div>

      {showTM && (
        <TaskModal task={editTask} projects={projects} users={users}
          onClose={()=>{setShowTM(false);setEditTask(null);}}
          onSaved={()=>{load();setShowTM(false);setEditTask(null);}} />
      )}
    </div>
  );
}
