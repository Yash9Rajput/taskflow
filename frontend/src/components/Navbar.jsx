import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, Badge } from './UI';

const TaskFlowLogo = () => (
  <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill="url(#nl)"/>
    <defs>
      <linearGradient id="nl" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect x="18" y="20" width="28" height="5" rx="2.5" fill="white"/>
    <rect x="29.5" y="20" width="5" height="24" rx="2.5" fill="white"/>
    <circle cx="48" cy="16" r="4" fill="#c4b5fd"/>
  </svg>
);

const links = [
  { to:'/',         label:'Dashboard', icon:'⊞' },
  { to:'/projects', label:'Projects',  icon:'◫' },
  { to:'/tasks',    label:'Tasks',     icon:'☑' },
  { to:'/team',     label:'Team',      icon:'⊛' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <NavLink to="/" className="nav-logo">
        <TaskFlowLogo />
        TaskFlow
      </NavLink>

      <div style={{display:'flex',gap:2,flex:1}}>
        {links.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} end={to==='/'} className={({isActive})=>`nav-link${isActive?' active':''}`}>
            <span style={{fontSize:13,opacity:0.8}}>{icon}</span> {label}
          </NavLink>
        ))}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:10,marginLeft:'auto'}}>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span className="pulse-dot" style={{background:'#10b981'}}/>
          <span style={{fontSize:11,color:'var(--text-2)'}}>Live</span>
        </div>
        <Badge role={user?.role}/>
        <div style={{display:'flex',alignItems:'center',gap:8,padding:'4px 10px',borderRadius:'var(--r-sm)',border:'1px solid var(--border)'}}>
          <Avatar user={user} size={26}/>
          <span style={{fontSize:13,fontWeight:500}}>{user?.name?.split(' ')[0]}</span>
        </div>
        <button className="btn btn-sm" onClick={()=>{logout();navigate('/login');}}>
          Sign out
        </button>
      </div>
    </nav>
  );
}
