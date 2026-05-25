import React, { useState } from 'react';
import { projectsAPI } from '../api';
import { Avatar } from './UI';

export default function ProjectModal({ project, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:        project?.name        || '',
    description: project?.description || '',
    memberIds:   project?.members?.map(m=>m.id||m) || [],
  });
  const [loading, setLoading] = useState(false);
  const [search,  setSearch]  = useState('');
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

  const filteredUsers = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal-box" style={{maxWidth:520,maxHeight:'85vh',display:'flex',flexDirection:'column'}}>
        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexShrink:0}}>
          <div style={{fontFamily:'var(--font-d)',fontSize:17,fontWeight:600}}>{project ? 'Edit Project' : 'New Project'}</div>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{overflowY:'auto',flex:1}}>
          <div className="field"><label>Project Name *</label><input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Website Redesign"/></div>
          <div className="field"><label>Description</label><textarea value={form.description} onChange={e=>set('description',e.target.value)} placeholder="What is this project about?" style={{minHeight:80}}/></div>
          <div className="field">
            <label>Team Members ({form.memberIds.length} selected)</label>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search members…" style={{marginBottom:8,fontSize:12}}/>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,maxHeight:200,overflowY:'auto',paddingRight:4}}>
              {filteredUsers.map(u=>{
                const sel = form.memberIds.includes(u.id);
                return (
                  <div key={u.id} onClick={()=>toggleMember(u.id)}
                    style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:'var(--r-sm)',border:`1px solid ${sel?'var(--accent)':'var(--border)'}`,background:sel?'rgba(99,102,241,0.1)':'transparent',cursor:'pointer',transition:'all 0.2s'}}>
                    <Avatar user={u} size={24}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,color:sel?'#a5b4fc':'var(--text-2)',fontWeight:sel?600:400,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.name}</div>
                      <div style={{fontSize:10,color:'var(--text-3)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{u.role}</div>
                    </div>
                    {sel && <span style={{color:'var(--accent)',fontSize:14,flexShrink:0}}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'1rem',paddingTop:'1rem',borderTop:'1px solid var(--border)',flexShrink:0}}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading?'Saving…':'Save Project'}</button>
        </div>
      </div>
    </div>
  );
}
