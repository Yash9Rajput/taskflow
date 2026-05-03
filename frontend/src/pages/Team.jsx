import React, { useState, useEffect } from 'react';
import { usersAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge, ProgressBar, Button, Modal, Field, Spinner, Empty } from '../components/UI';

export default function Team() {
  const { isAdmin, user } = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [inviteError, setInviteError] = useState('');
  const [inviteSaving, setInviteSaving] = useState(false);

  const load = () => {
    setLoading(true);
    usersAPI.list().then(r => setUsers(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleRoleToggle = async (u) => {
    const newRole = u.role === 'admin' ? 'member' : 'admin';
    await usersAPI.updateRole(u.id, newRole);
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x));
  };

  const handleInvite = async () => {
    if (!inviteForm.name || !inviteForm.email || !inviteForm.password) { setInviteError('All fields required'); return; }
    setInviteSaving(true);
    try {
      await authAPI.invite(inviteForm);
      setShowInvite(false); setInviteForm({ name: '', email: '', password: '', role: 'member' }); load();
    } catch (e) {
      setInviteError(e.response?.data?.error || 'Failed to invite member');
    } finally { setInviteSaving(false); }
  };

  const inp = { width: '100%', padding: '7px 10px', border: '0.5px solid var(--color-border-secondary)', borderRadius: 'var(--border-radius-md)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)' };

  if (loading) return <Spinner />;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ fontSize: 18, fontWeight: 500 }}>Team</div>
        {isAdmin && <Button variant="primary" size="sm" onClick={() => setShowInvite(true)}>+ Invite member</Button>}
      </div>

      <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 'var(--border-radius-lg)', padding: '0.25rem 1.25rem' }}>
        {users.length === 0 ? <Empty message="No team members." /> : users.map(u => (
          <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '0.5px solid var(--color-border-tertiary)' }}>
            <Avatar user={u} size={38} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>
                {u.name} {u.id === user.id && <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>(you)</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{u.email}</div>
            </div>
            <Badge role={u.role} />
            {isAdmin && u.id !== user.id && (
              <Button size="sm" onClick={() => handleRoleToggle(u)}>
                {u.role === 'admin' ? 'Make member' : 'Make admin'}
              </Button>
            )}
          </div>
        ))}
      </div>

      {showInvite && (
        <Modal title="Invite team member" onClose={() => setShowInvite(false)}>
          <Field label="Full name"><input style={inp} value={inviteForm.name} onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))} /></Field>
          <Field label="Email"><input style={inp} type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} /></Field>
          <Field label="Temporary password"><input style={inp} type="password" value={inviteForm.password} onChange={e => setInviteForm(f => ({ ...f, password: e.target.value }))} /></Field>
          <Field label="Role">
            <select style={inp} value={inviteForm.role} onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          {inviteError && <div style={{ color: 'var(--color-text-danger)', fontSize: 12, marginBottom: 8 }}>{inviteError}</div>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <Button onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleInvite} disabled={inviteSaving}>{inviteSaving ? 'Saving…' : 'Add member'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
