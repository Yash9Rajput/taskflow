import React, { useState } from 'react';
import { tasksAPI } from '../api';

export default function TaskModal({ task, projects, users, defaultProjectId, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    project_id:  task?.project_id  || defaultProjectId || (projects[0]?.id ?? ''),
    assignee_id: task?.assignee_id || '',
    status:      task?.status      || 'todo',
    priority:    task?.priority    || 'medium',
    due_date:    task?.due_date    || '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setLoading(true);
    setError('');
    try {
      // Build clean payload — send null instead of empty string
      const payload = {
        title:       form.title,
        description: form.description,
        status:      form.status,
        priority:    form.priority,
        project_id:  form.project_id  || null,
        assignee_id: form.assignee_id || null,
        due_date:    form.due_date    || null,
      };
      if (task) await tasksAPI.update(task.id, payload);
      else       await tasksAPI.create(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const statusOpts = [{v:'todo',l:'To Do'},{v:'in-progress',l:'In Progress'},{v:'done',l:'Done'}];
  const prioOpts   = [{v:'low',l:'🟢 Low'},{v:'medium',l:'🟡 Medium'},{v:'high',l:'🔴 High'}];

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{maxWidth:520,maxHeight:'88vh',display:'flex',flexDirection:'column'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexShrink:0}}>
          <div style={{fontFamily:'var(--font-d)',fontSize:17,fontWeight:600}}>{task ? 'Edit Task' : 'New Task'}</div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>

        {error && (
          <div style={{background:'rgba(239,68,68,0.1)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'var(--r-sm)',padding:'10px 14px',fontSize:13,color:'#fca5a5',marginBottom:'1rem',flexShrink:0}}>
            ⚠ {error}
          </div>
        )}

        {/* Scrollable body */}
        <div style={{overflowY:'auto',flex:1,paddingRight:2}}>
          <div className="field">
            <label>Title *</label>
            <input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Task title"/>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={form.description} onChange={e=>set('description',e.target.value)}
              placeholder="What needs to be done?" style={{minHeight:80}}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="field">
              <label>Project</label>
              <select value={form.project_id} onChange={e=>set('project_id',e.target.value)}>
                <option value="">No project</option>
                {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Assignee</label>
              <select value={form.assignee_id} onChange={e=>set('assignee_id',e.target.value)}>
                <option value="">Unassigned</option>
                {users.map(u=><option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <div className="field">
              <label>Status</label>
              <select value={form.status} onChange={e=>set('status',e.target.value)}>
                {statusOpts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select value={form.priority} onChange={e=>set('priority',e.target.value)}>
                {prioOpts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <label>Due Date</label>
            <input type="date" value={form.due_date} onChange={e=>set('due_date',e.target.value)}/>
          </div>
        </div>

        {/* Footer */}
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',paddingTop:'1rem',borderTop:'1px solid var(--border)',flexShrink:0}}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : (task ? 'Update Task' : 'Save Task')}
          </button>
        </div>
      </div>
    </div>
  );
}
