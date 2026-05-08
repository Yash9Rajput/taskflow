import React, { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, Spinner, Empty, taskStatusDisplay } from '../components/UI';
import TaskModal       from '../components/TaskModal';
import TaskDetailModal from '../components/TaskDetailModal';
import { DEVELOPER_EMAIL } from '../App';

const TABS = [
  { key:'all',         label:'All',         color:'#818cf8' },
  { key:'todo',        label:'To Do',       color:'#6366f1' },
  { key:'in-progress', label:'In Progress', color:'#fbbf24' },
  { key:'done',        label:'Done',        color:'#34d399' },
  { key:'overdue',     label:'Overdue',     color:'#f87171' },
];

export default function Tasks() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isDev   = user?.email === DEVELOPER_EMAIL;

  const [tasks,    setTasks]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [users,    setUsers]    = useState([]);
  const [tab,      setTab]      = useState('all');
  const [loading,  setLoading]  = useState(true);
  const [showTM,   setShowTM]   = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [viewTask, setViewTask] = useState(null);
  const [search,   setSearch]   = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = () => {
    Promise.all([tasksAPI.list(), projectsAPI.list(), usersAPI.list()])
      .then(([t,p,u]) => { setTasks(t.data); setProjects(p.data); setUsers(u.data); })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const now = new Date();
  const isOverdue = t => t.status !== 'done' && t.due_date && new Date(t.due_date) < now;

  const filtered = tasks.filter(t => {
    const matchTab = tab==='all' ? true : tab==='overdue' ? isOverdue(t) : (t.status===tab && !isOverdue(t));
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const counts = {
    all: tasks.length,
    todo: tasks.filter(t=>t.status==='todo').length,
    'in-progress': tasks.filter(t=>t.status==='in-progress').length,
    done: tasks.filter(t=>t.status==='done').length,
    overdue: tasks.filter(isOverdue).length,
  };

  // Permissions
  const canDeleteTask = (t) => isDev || (isAdmin && t.created_by === user.id);

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return;
    await tasksAPI.delete(deleteConfirm.id);
    setDeleteConfirm(null);
    load();
  };

  if (loading) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh'}}><Spinner/></div>;

  return (
    <div>
      <div className="section-head au">
        <div>
          <h1 className="page-title" style={{marginBottom:4}}>Tasks</h1>
          <p style={{fontSize:14,color:'var(--text-2)'}}>{tasks.length} total tasks</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={()=>{setEditTask(null);setShowTM(true);}}>+ New Task</button>}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1.25rem',flexWrap:'wrap'}} className="au1">
        <div className="tabs">
          {TABS.map(t => (
            <button key={t.key} className={`tab-btn ${tab===t.key?'active':''}`} onClick={()=>setTab(t.key)}>
              {t.label}
              <span style={{marginLeft:5,padding:'1px 7px',borderRadius:999,fontSize:10,fontWeight:700,
                background:tab===t.key?`${t.color}25`:'rgba(255,255,255,0.06)',
                color:tab===t.key?t.color:'var(--text-3)'}}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="🔍  Search tasks…"
          style={{flex:1,minWidth:200,maxWidth:300,fontSize:13}}/>
      </div>

      <div className="card au2" style={{padding:'0.5rem 1.5rem'}}>
        {/* Header */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 130px 80px 110px 100px',gap:12,padding:'10px 0',borderBottom:'1px solid var(--border)',marginBottom:4}}>
          {['Task','Assignee','Priority','Status','Actions'].map(h=>(
            <div key={h} style={{fontSize:11,fontWeight:600,color:'var(--text-3)',textTransform:'uppercase',letterSpacing:'0.08em'}}>{h}</div>
          ))}
        </div>

        {filtered.length===0 ? <Empty message={`No ${tab} tasks found.`}/> :
          filtered.map(t => {
            const assignee = users.find(u=>u.id===t.assignee_id);
            const proj     = projects.find(p=>p.id===t.project_id);
            const canEdit  = isAdmin || t.assignee_id===user.id;
            const od       = isOverdue(t);
            return (
              <div key={t.id}
                style={{display:'grid',gridTemplateColumns:'1fr 130px 80px 110px 100px',gap:12,padding:'11px 0',borderBottom:'1px solid rgba(255,255,255,0.04)',alignItems:'center',cursor:'pointer',borderRadius:'var(--r-sm)',transition:'background 0.15s'}}
                onClick={()=>setViewTask(t)}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div style={{minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:500,marginBottom:2}}>{t.title}</div>
                  <div style={{fontSize:11,color:'var(--text-3)'}}>{proj?.name||'—'} · {od?<span style={{color:'#f87171'}}>⚠ {t.due_date}</span>:(t.due_date||'No date')}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:6}} onClick={e=>e.stopPropagation()}>
                  <Avatar user={assignee||{name:'?'}} size={24}/>
                  <span style={{fontSize:12,color:'var(--text-2)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{assignee?.name?.split(' ')[0]||'—'}</span>
                </div>
                <div onClick={e=>e.stopPropagation()}><Badge priority={t.priority}/></div>
                <div onClick={e=>e.stopPropagation()}><Badge status={taskStatusDisplay(t)}/></div>
                <div style={{display:'flex',gap:4}} onClick={e=>e.stopPropagation()}>
                  <button className="btn btn-sm" onClick={()=>setViewTask(t)} title="View details">👁</button>
                  {canEdit && <button className="btn btn-sm" onClick={()=>{setEditTask(t);setShowTM(true);}}>✎</button>}
                  {canDeleteTask(t) && (
                    <button className="btn btn-sm btn-danger"
                      onClick={()=>setDeleteConfirm({id:t.id,name:t.title})}>✕</button>
                  )}
                </div>
              </div>
            );
          })
        }
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={()=>setDeleteConfirm(null)}>
          <div className="modal-box" style={{maxWidth:400,textAlign:'center'}} onClick={e=>e.stopPropagation()}>
            <div style={{fontSize:48,marginBottom:'1rem'}}>⚠️</div>
            <div style={{fontFamily:'var(--font-d)',fontSize:18,fontWeight:600,marginBottom:8}}>Delete Task?</div>
            <div style={{fontSize:14,color:'var(--text-2)',marginBottom:4}}>
              <strong style={{color:'var(--text)'}}>&ldquo;{deleteConfirm.name}&rdquo;</strong>
            </div>
            <div style={{fontSize:13,color:'var(--text-3)',marginBottom:'1.5rem',lineHeight:1.6}}>
              This will permanently delete this task. This action cannot be undone.
            </div>
            <div style={{display:'flex',gap:10,justifyContent:'center'}}>
              <button className="btn" onClick={()=>setDeleteConfirm(null)} style={{minWidth:100}}>No, Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirmed} style={{minWidth:100}}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}

      {viewTask && <TaskDetailModal task={viewTask} users={users} projects={projects} onClose={()=>setViewTask(null)} onEdit={t=>{setEditTask(t);setViewTask(null);setShowTM(true);}}/>}
      {showTM && <TaskModal task={editTask} projects={projects} users={users} onClose={()=>{setShowTM(false);setEditTask(null);}} onSaved={()=>{load();setShowTM(false);setEditTask(null);}}/>}
    </div>
  );
}
