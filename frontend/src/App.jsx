import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CursorGlow from './components/CursorGlow';
import Login    from './pages/Login';
import Signup   from './pages/Signup';
import Dashboard    from './pages/Dashboard';
import Projects     from './pages/Projects';
import Tasks        from './pages/Tasks';
import Team         from './pages/Team';
import Notes        from './pages/Notes';
import AI           from './pages/AI';
import AboutTaskFlow    from './pages/AboutTaskFlow';
import AboutDeveloper   from './pages/AboutDeveloper';
import PrivacyPolicy    from './pages/PrivacyPolicy';
import './index.css';

// The "developer" is identified by this email — only this account has god-mode delete
export const DEVELOPER_EMAIL = 'rajput.kyar@gmail.com';

function AppLayout() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.3)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
  // No session in THIS tab → go to login
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      <CursorGlow />
      <Navbar />
      <div className="page-wrap" style={{flex:1}}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

// Public layout pages (no Navbar/Footer needed)
function PublicLayout({ children }) {
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <CursorGlow/>
      {children}
    </div>
  );
}

// Static pages have Navbar + Footer but no auth required
function StaticLayout() {
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column'}}>
      <CursorGlow/>
      <Navbar/>
      <div className="page-wrap" style={{flex:1}}>
        <Outlet/>
      </div>
      <Footer/>
    </div>
  );
}

function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  // While checking session — show nothing (prevents flash)
  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.3)', borderTop: '3px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
  // Already logged in THIS TAB — go to dashboard
  // Each tab is independent, so this only redirects if THIS tab has a session
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Guest-only */}
            <Route path="/login"  element={<GuestOnly><PublicLayout><Login /></PublicLayout></GuestOnly>} />
            <Route path="/signup" element={<GuestOnly><PublicLayout><Signup /></PublicLayout></GuestOnly>} />

            {/* Static public pages */}
            <Route element={<StaticLayout/>}>
              <Route path="/about"     element={<AboutTaskFlow/>}  />
              <Route path="/developer" element={<AboutDeveloper/>} />
              <Route path="/privacy"   element={<PrivacyPolicy/>}  />
            </Route>

            {/* Authenticated app */}
            <Route element={<AppLayout/>}>
              <Route path="/"         element={<Dashboard/>}  />
              <Route path="/projects" element={<Projects/>}   />
              <Route path="/tasks"    element={<Tasks/>}      />
              <Route path="/team"     element={<Team/>}       />
              <Route path="/notes"    element={<Notes/>}      />
              <Route path="/ai"       element={<AI/>}         />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
