import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge } from './UI';

const links = [
  { to: '/',         label: 'Dashboard' },
  { to: '/projects', label: 'Projects' },
  { to: '/tasks',    label: 'Tasks' },
  { to: '/team',     label: 'Team' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav style={{
      background: 'var(--color-background-primary)',
      borderBottom: '0.5px solid var(--color-border-tertiary)',
      padding: '0 1.5rem',
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      height: 52, position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div style={{ fontSize: 15, fontWeight: 500, marginRight: 'auto' }}>&#9670; TaskFlow</div>

      {links.map(({ to, label }) => (
        <NavLink key={to} to={to} end={to === '/'}
          style={({ isActive }) => ({
            padding: '6px 12px', borderRadius: 'var(--border-radius-md)',
            fontSize: 13, cursor: 'pointer', textDecoration: 'none',
            background: isActive ? 'var(--color-background-secondary)' : 'transparent',
            color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
          })}>
          {label}
        </NavLink>
      ))}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Badge role={user?.role} />
        <Avatar user={user} size={32} />
        <span style={{ fontSize: 13 }}>{user?.name?.split(' ')[0]}</span>
        <button
          onClick={handleLogout}
          style={{ padding: '4px 10px', fontSize: 12, borderRadius: 'var(--border-radius-md)', border: '0.5px solid var(--color-border-secondary)', background: 'var(--color-background-primary)', color: 'var(--color-text-primary)', cursor: 'pointer' }}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
