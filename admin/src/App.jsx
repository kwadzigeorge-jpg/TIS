import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import POIsPage from './pages/POIsPage';
import ReviewsPage from './pages/ReviewsPage';

const NAV_STYLE = {
  display: 'flex', gap: 24, padding: '16px 24px',
  backgroundColor: '#1a6b3c', alignItems: 'center',
};
const LINK_STYLE = { color: '#fff', textDecoration: 'none', fontWeight: 600, fontSize: 15 };

export default function App() {
  return (
    <>
      <nav style={NAV_STYLE}>
        <span style={{ color: '#fff', fontSize: 20, fontWeight: 800, marginRight: 16 }}>🗺 TIS Admin</span>
        <Link to="/dashboard" style={LINK_STYLE}>Dashboard</Link>
        <Link to="/pois" style={LINK_STYLE}>POIs</Link>
        <Link to="/reviews" style={LINK_STYLE}>Reviews</Link>
      </nav>
      <main style={{ padding: 24 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/pois" element={<POIsPage />} />
          <Route path="/reviews" element={<ReviewsPage />} />
        </Routes>
      </main>
    </>
  );
}
