import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar          from './components/Navbar';
import Footer          from './components/Footer';
import CursorGlow      from './components/CursorGlow';

// Auth pages
import Login           from './pages/Login';
import Signup          from './pages/Signup';
import ForgotPassword  from './pages/ForgotPassword';
import ResetPassword   from './pages/ResetPassword';
import GoogleCallback  from './pages/GoogleCallback';

// App pages
import Dashboard       from './pages/Dashboard';
import Projects        from './pages/Projects';
import Tasks           from './pages/Tasks';
import Team            from './pages/Team';
import Notes           from './pages/Notes';
import AI              from './pages/AI';

// Static pages
import AboutTaskFlow   from './pages/AboutTaskFlow';
import AboutDeveloper  from './pages/AboutDeveloper';
import PrivacyPolicy   from './pages/PrivacyPolicy';

import './index.css';

export const DEVELOPER_EMAIL = 'rajput.kyar@gmail.com';

// ── Layouts ───────────────────────────────────────────────────────────────────

function AppLayout() {
  const { user, loading } = useAuth();
  if (loading) return null;
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

function PublicLayout({ children }) {
  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <CursorGlow/>
      {children}
    </div>
  );
}

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

// Redirect already-logged-in users away from auth pages
function GuestOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return children;
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>

            {/* ── Guest-only auth pages ───────────────────────────────────── */}
            <Route path="/login"
              element={<GuestOnly><PublicLayout><Login/></PublicLayout></GuestOnly>} />
            <Route path="/signup"
              element={<GuestOnly><PublicLayout><Signup/></PublicLayout></GuestOnly>} />
            <Route path="/forgot-password"
              element={<GuestOnly><PublicLayout><ForgotPassword/></PublicLayout></GuestOnly>} />

            {/* Reset password — accessible without login (user may not be logged in) */}
            <Route path="/reset-password"
              element={<PublicLayout><ResetPassword/></PublicLayout>} />

            {/* Google OAuth callback — no auth check needed, handled inside the component */}
            <Route path="/auth/callback"
              element={<PublicLayout><GoogleCallback/></PublicLayout>} />

            {/* ── Static public pages ─────────────────────────────────────── */}
            <Route element={<StaticLayout/>}>
              <Route path="/about"     element={<AboutTaskFlow/>}  />
              <Route path="/developer" element={<AboutDeveloper/>} />
              <Route path="/privacy"   element={<PrivacyPolicy/>}  />
            </Route>

            {/* ── Authenticated app ───────────────────────────────────────── */}
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
