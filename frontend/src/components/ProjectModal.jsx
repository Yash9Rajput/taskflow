import React, { useState, useEffect } from 'react';
import { projectsAPI, usersAPI } from '../api';
import { Modal, Field, Button } from './UI';

export default function ProjectModal({ project, onClose, onSaved }) {
  const isEdit = !!project;
  const [form, setForm]     = useState({ name: project?.name || '', description: project?.description || '', member_ids: project?.members?.map(m => m.id) || [] });
  const [users, setUsers]   = useState([]);
  const [error, setError]   = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { usersAPI.list().then(r => setUsers(r.data)); }, []);

  const toggleMember = (id) => {
    setForm(f => ({
      ...f,
      member_ids: f.member_ids.includes(id) ? f.member_ids.filter(x => x !== id) : [...f.member_ids, id],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Project name is required'); return; }
    setSaving(true);
    try {
      const res = isEdit
        ? await projectsAPI.update(project.id, form)
        : await projectsAPI.create(form);
      onSaved(res.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save project');
    } finally { setSaving(false); }
  };

  const inp = { width: '100%', padding: '7px 10px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)' };

  return (
    <Modal title={isEdit ? 'Edit project' : 'New project'} onClose={onClose}>
      <Field label="Project name">
        <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Project name" />
      </Field>
      <Field label="Description">
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
      </Field>
      <Field label="Members">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {users.map(u => (
            <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.member_ids.includes(u.id)} onChange={() => toggleMember(u.id)} />
              {u.name}
            </label>
          ))}
        </div>
      </Field>
      {error && <div style={{ color: 'var(--color-text-danger)', fontSize: 12, marginBottom: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save project'}</Button>
      </div>
    </Modal>
  );
}
