import React, { useState } from 'react';
import { projectsAPI } from '../api';
import { Avatar } from './UI';

export default function ProjectModal({ project, users, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:        project?.name        || '',
    description: project?.description || '',
    memberIds:   project?.members?.map(m => m.id || m) || [],
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [search,  setSearch]  = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMember = (id) => setForm(f => ({
    ...f,
    memberIds: f.memberIds.includes(id) ? f.memberIds.filter(x => x !== id) : [...f.memberIds, id],
  }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setLoading(true); setError('');
    try {
      const payload = { name: form.name, description: form.description, member_ids: form.memberIds };
      if (project) await projectsAPI.update(project.id, payload);
      else          await projectsAPI.create(payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save project');
    } finally { setLoading(false); }
  };

  const filteredUsers = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}>
      <div style={{
        background: 'var(--bg-card)', border: '1px solid var(--border-hi)',
        borderRadius: 'var(--r-xl)', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        maxWidth: 520, width: '100%', maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'scaleIn 0.2s ease',
      }}>
        {/* Header */}
        <div style={{ padding: '1.5rem 1.5rem 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 17, fontWeight: 600 }}>
              {project ? 'Edit Project' : 'New Project'}
            </div>
            <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
          </div>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#fca5a5', marginBottom: '1rem' }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 1.5rem' }}>
          <div className="field">
            <label>Project Name *</label>
            <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Website Redesign" autoFocus />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="What is this project about?" style={{ minHeight: 80 }} />
          </div>
          <div className="field">
            <label>Team Members ({form.memberIds.length} selected)</label>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search members…" style={{ marginBottom: 8, fontSize: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 200, overflowY: 'auto', paddingRight: 2 }}>
              {filteredUsers.map(u => {
                const sel = form.memberIds.includes(u.id);
                return (
                  <div key={u.id} onClick={() => toggleMember(u.id)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 'var(--r-sm)', border: `1px solid ${sel ? 'var(--accent)' : 'var(--border)'}`, background: sel ? 'rgba(99,102,241,0.1)' : 'transparent', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <Avatar user={u} size={24} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: sel ? '#a5b4fc' : 'var(--text-2)', fontWeight: sel ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-3)' }}>{u.role}</div>
                    </div>
                    {sel && <span style={{ color: 'var(--accent)', fontSize: 14, flexShrink: 0 }}>✓</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : (project ? 'Update Project' : 'Save Project')}
          </button>
        </div>
      </div>
    </div>
  );
}
