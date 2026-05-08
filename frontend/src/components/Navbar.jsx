import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Avatar } from './UI';

const Logo = () => (
  <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="14" fill="url(#nl2)"/>
    <defs>
      <linearGradient id="nl2" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1"/><stop offset="1" stopColor="#8b5cf6"/>
      </linearGradient>
    </defs>
    <rect x="18" y="20" width="28" height="5" rx="2.5" fill="white"/>
    <rect x="29.5" y="20" width="5" height="24" rx="2.5" fill="white"/>
    <circle cx="48" cy="16" r="4" fill="#c4b5fd"/>
  </svg>
);

const links = [
  { to:'/',         label:'Dashboard' },
  { to:'/projects', label:'Projects'  },
  { to:'/tasks',    label:'Tasks'     },
  { to:'/team',     label:'Team'      },
  { to:'/notes',    label:'Notes'     },
  { to:'/ai',       label:'✦ AI'      },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, cycle } = useTheme();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <nav className="navbar" style={{flexWrap:'wrap',height:'auto',minHeight:58,gap:8}}>
      <NavLink to="/" className="nav-logo" style={{textDecoration:'none'}}>
        <Logo/> TaskFlow
      </NavLink>

      <div style={{display:'flex',gap:2,flexWrap:'wrap'}}>
        {links.map(({ to, label }) => (
          <NavLink key={to} to={to} end={to==='/'}
            className={({isActive}) => `nav-link${isActive?' active':''}`}
            style={to==='/ai'?{background:'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))',color:'#c4b5fd',border:'1px solid rgba(139,92,246,0.3)'}:{}}>
            {label}
          </NavLink>
        ))}
      </div>

      <div style={{display:'flex',alignItems:'center',gap:8,marginLeft:'auto'}}>
        {/* Live indicator */}
        <div style={{display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:'var(--r-sm)',border:'1px solid var(--border)'}}>
          <span className="pulse-dot" style={{background:'#10b981'}}/>
          <span style={{fontSize:11,color:'var(--text-2)'}}>Live</span>
        </div>

        {/* Theme cycler */}
        <button onClick={cycle} title={`Theme: ${theme.name}`}
          style={{width:36,height:36,borderRadius:'50%',border:'1px solid var(--border)',background:'var(--bg-card)',cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center',transition:'all 0.2s'}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--accent)';e.currentTarget.style.transform='rotate(20deg) scale(1.1)';}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.transform='none';}}>
          {theme.icon}
        </button>

        {/* User profile dropdown */}
        <div ref={profileRef} style={{position:'relative'}}>
          <div onClick={() => setProfileOpen(o => !o)}
            style={{display:'flex',alignItems:'center',gap:8,padding:'5px 10px',borderRadius:'var(--r-sm)',border:'1px solid var(--border)',cursor:'pointer',background: profileOpen?'var(--bg-hover)':'transparent',transition:'all 0.2s'}}
            onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
            onMouseLeave={e=>{if(!profileOpen)e.currentTarget.style.background='transparent';}}>
            <Avatar user={user} size={26}/>
            <span style={{fontSize:13,fontWeight:500,color:'var(--text)'}}>{user?.name?.split(' ')[0]}</span>
            <span style={{fontSize:10,color:'var(--text-3)',transition:'transform 0.2s',display:'inline-block',transform:profileOpen?'rotate(180deg)':'none'}}>▼</span>
          </div>

          {profileOpen && (
            <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,width:240,background:'var(--bg-card)',border:'1px solid var(--border-hi)',borderRadius:'var(--r-lg)',boxShadow:'0 20px 60px rgba(0,0,0,0.6)',zIndex:500,overflow:'hidden',animation:'scaleIn 0.2s ease'}}>
              {/* Profile header */}
              <div style={{padding:'1.25rem',background:'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))',borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <Avatar user={user} size={44}/>
                  <div>
                    <div style={{fontWeight:600,fontSize:14,color:'var(--text)'}}>{user?.name}</div>
                    <div style={{fontSize:11,color:'var(--text-2)',marginTop:2}}>{user?.email}</div>
                    <span style={{display:'inline-flex',alignItems:'center',gap:4,marginTop:4,padding:'2px 8px',borderRadius:999,fontSize:10,fontWeight:700,background:user?.role==='admin'?'rgba(139,92,246,0.2)':'rgba(6,182,212,0.15)',color:user?.role==='admin'?'#c4b5fd':'#67e8f9',border:`1px solid ${user?.role==='admin'?'rgba(139,92,246,0.3)':'rgba(6,182,212,0.25)'}`}}>
                      {user?.role==='admin'?'👑':'👤'} {user?.role?.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              {/* Menu items */}
              {[
                {icon:'⊞', label:'Dashboard',   action:()=>{navigate('/');setProfileOpen(false);}},
                {icon:'◫', label:'My Projects',  action:()=>{navigate('/projects');setProfileOpen(false);}},
                {icon:'☑', label:'My Tasks',     action:()=>{navigate('/tasks');setProfileOpen(false);}},
                {icon:'📝',label:'Notes',        action:()=>{navigate('/notes');setProfileOpen(false);}},
                {icon:'✦', label:'AI Assistant', action:()=>{navigate('/ai');setProfileOpen(false);}},
              ].map(item=>(
                <div key={item.label} onClick={item.action}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'10px 1rem',cursor:'pointer',transition:'background 0.15s',fontSize:13,color:'var(--text-2)'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg-hover)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span style={{fontSize:14,width:18,textAlign:'center'}}>{item.icon}</span>{item.label}
                </div>
              ))}
              <div style={{borderTop:'1px solid var(--border)',padding:'0.5rem'}}>
                <div onClick={()=>{logout();navigate('/login');}}
                  style={{display:'flex',alignItems:'center',gap:10,padding:'10px 0.75rem',cursor:'pointer',borderRadius:'var(--r-sm)',color:'#f87171',fontSize:13,transition:'background 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(239,68,68,0.1)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  ⇤ Sign out
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
