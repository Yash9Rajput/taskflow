import React, { useState } from 'react';
import { tasksAPI } from '../api';
import { Modal } from './UI';

export default function TaskModal({ task, projects, users, defaultProjectId, onClose, onSaved }) {
  const [form, setForm] = useState({
    title:       task?.title       || '',
    description: task?.description || '',
    project_id:  task?.project_id  || defaultProjectId || projects[0]?.id || '',
    assignee_id: task?.assignee_id || '',
    status:      task?.status      || 'todo',
    priority:    task?.priority    || 'medium',
    due_date:    task?.due_date    || '',
  });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSave = async() => {
    if (!form.title.trim()) return;
    setLoading(true);
    try {
      if (task) await tasksAPI.update(task.id, form);
      else       await tasksAPI.create(form);
      onSaved();
    } finally { setLoading(false); }
  };

  const statusOpts = [{v:'todo',l:'To Do'},{v:'in-progress',l:'In Progress'},{v:'done',l:'Done'}];
  const prioOpts   = [{v:'low',l:'Low'},{v:'medium',l:'Medium'},{v:'high',l:'High'}];

  return (
    <Modal title={task ? 'Edit Task' : 'New Task'} onClose={onClose}>
      <div className="field"><label>Title *</label><input value={form.title} onChange={e=>set('title',e.target.value)} placeholder="Task title" /></div>
      <div className="field"><label>Description</label><textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="What needs to be done?" /></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
        <div className="field">
          <label>Project</label>
          <select value={form.project_id} onChange={e=>set('project_id',e.target.value)}>
            {projects.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Assignee</label>
          <select value={form.assignee_id} onChange={e=>set('assignee_id',e.target.value)}>
            <option value="">Unassigned</option>
            {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
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
      <div className="field"><label>Due Date</label><input type="date" value={form.due_date} onChange={e=>set('due_date',e.target.value)} /></div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'0.5rem'}}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading?'Saving…':'Save Task'}</button>
      </div>
    </Modal>
  );
}
