import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge } from './UI';

const links = [
  { to:'/',         label:'Dashboard', icon:'⊞' },
  { to:'/projects', label:'Projects',  icon:'◫' },
  { to:'/tasks',    label:'Tasks',     icon:'☑' },
  { to:'/team',     label:'Team',      icon:'⊛' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="navbar">
      <div className="nav-logo">⬡ TaskFlow</div>

      <div style={{display:'flex', gap:2, flex:1}}>
        {links.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <span style={{fontSize:14}}>{icon}</span> {label}
          </NavLink>
        ))}
      </div>

      <div style={{display:'flex', alignItems:'center', gap:10, marginLeft:'auto'}}>
        <Badge role={user?.role} />
        <div style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'4px 8px', borderRadius:'var(--radius-sm)', transition:'background 0.2s'}}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.06)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <Avatar user={user} size={30} />
          <span style={{fontSize:13, fontWeight:500}}>{user?.name?.split(' ')[0]}</span>
        </div>
        <button className="btn btn-sm" onClick={handleLogout}
          style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{fontSize:13}}>⇤</span> Sign out
        </button>
      </div>
    </nav>
  );
}
