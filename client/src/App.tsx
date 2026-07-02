import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ArtistDashboard from './pages/ArtistDashboard';
import FanDashboard from './pages/FanDashboard';

const API_URL = import.meta.env.VITE_API_URL ?? '';

function ProtectedRoute({ element }: { element: React.ReactElement }) {
  const [status, setStatus] = useState<'loading' | 'ok' | 'unauth'>('loading');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch(`${API_URL}/auth/me`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => { setUser(data); setStatus('ok'); })
      .catch(() => setStatus('unauth'));
  }, []);

  if (status === 'loading') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050507' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #1e1c22', borderTopColor: '#1db954', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
  if (status === 'unauth') return React.cloneElement(element as React.ReactElement<{ user?: any }>, { user: null });
  return React.cloneElement(element as React.ReactElement<{ user?: any }>, { user });
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/artist" element={<ProtectedRoute element={<ArtistDashboard />} />} />
        <Route path="/artist/dashboard" element={<ProtectedRoute element={<ArtistDashboard />} />} />
        <Route path="/fan" element={<ProtectedRoute element={<FanDashboard />} />} />
        <Route path="/fan/dashboard" element={<ProtectedRoute element={<FanDashboard />} />} />
      </Routes>
    </Router>
  );
}

export default App;
