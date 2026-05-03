import React, { useState, useEffect } from 'react';
import { tasksAPI, projectsAPI, usersAPI } from '../api';
import { Modal, Field, Button } from './UI';

export default function TaskModal({ task, defaultProjectId, onClose, onSaved }) {
  const isEdit = !!task;
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    project_id: task?.project_id || defaultProjectId || '',
    assignee_id: task?.assignee_id || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    due_date: task?.due_date || '',
  });
  const [projects, setProjects] = useState([]);
  const [users, setUsers]       = useState([]);
  const [error, setError]       = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    Promise.all([projectsAPI.list(), usersAPI.list()]).then(([pr, ur]) => {
      setProjects(pr.data); setUsers(ur.data);
    });
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (!form.project_id)   { setError('Please select a project'); return; }
    setSaving(true);
    try {
      const payload = { ...form, assignee_id: form.assignee_id || null, due_date: form.due_date || null };
      const res = isEdit ? await tasksAPI.update(task.id, payload) : await tasksAPI.create(payload);
      onSaved(res.data);
      onClose();
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save task');
    } finally { setSaving(false); }
  };

  const inp = { width: '100%', padding: '7px 10px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)' };

  return (
    <Modal title={isEdit ? 'Edit task' : 'New task'} onClose={onClose}>
      <Field label="Title">
        <input style={inp} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Task title" />
      </Field>
      <Field label="Description">
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 70 }} value={form.description} onChange={e => set('description', e.target.value)} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Project">
          <select style={inp} value={form.project_id} onChange={e => set('project_id', e.target.value)}>
            <option value="">Select project</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
        <Field label="Assignee">
          <select style={inp} value={form.assignee_id} onChange={e => set('assignee_id', e.target.value)}>
            <option value="">Unassigned</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select style={inp} value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="todo">To do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </Field>
        <Field label="Priority">
          <select style={inp} value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </Field>
      </div>
      <Field label="Due date">
        <input style={inp} type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
      </Field>
      {error && <div style={{ color: 'var(--color-text-danger)', fontSize: 12, marginBottom: 8 }}>{error}</div>}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save task'}</Button>
      </div>
    </Modal>
  );
}
