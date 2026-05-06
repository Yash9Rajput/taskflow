import React, { useState } from 'react';
import { projectsAPI } from '../api';
import { Modal, Avatar } from './UI';

export default function ProjectModal({ project, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:        project?.name        || '',
    description: project?.description || '',
    memberIds:   project?.members?.map(m=>m.id||m) || [],
  });
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const toggleMember = (id) => setForm(f=>({
    ...f,
    memberIds: f.memberIds.includes(id) ? f.memberIds.filter(x=>x!==id) : [...f.memberIds, id],
  }));

  const handleSave = async() => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      if (project) await projectsAPI.update(project.id, form);
      else          await projectsAPI.create(form);
      onSaved();
    } finally { setLoading(false); }
  };

  return (
    <Modal title={project ? 'Edit Project' : 'New Project'} onClose={onClose}>
      <div className="field"><label>Project Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Website Redesign" /></div>
      <div className="field"><label>Description</label><textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="What is this project about?" /></div>
      <div className="field">
        <label>Team Members</label>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:4}}>
          {users.map(u=>{
            const sel = form.memberIds.includes(u.id);
            return (
              <div key={u.id} onClick={()=>toggleMember(u.id)}
                style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:'var(--radius-sm)',border:`1px solid ${sel?'var(--accent)':'var(--border)'}`,background:sel?'rgba(99,102,241,0.1)':'transparent',cursor:'pointer',transition:'all 0.2s'}}>
                <Avatar user={u} size={24} />
                <span style={{fontSize:13,flex:1,color:sel?'var(--text-primary)':'var(--text-secondary)'}}>{u.name}</span>
                {sel && <span style={{color:'var(--accent)',fontSize:14}}>✓</span>}
              </div>
            );
          })}
        </div>
      </div>
      <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'0.5rem'}}>
        <button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading?'Saving…':'Save Project'}</button>
      </div>
    </Modal>
  );
}
