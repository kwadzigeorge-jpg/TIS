import React, { useEffect, useState } from 'react';
import api from '../services/api';

const card = { background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 32 };

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics').then((r) => setStats(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!stats) return <p>Could not load stats.</p>;

  return (
    <div>
      <h1 style={{ marginBottom: 24, fontSize: 24 }}>Dashboard</h1>

      <div style={grid}>
        <StatCard label="Total Users" value={stats.total_users} color="#1a6b3c" />
        <StatCard label="Active POIs" value={stats.total_pois} color="#e85d04" />
        <StatCard label="Total Reviews" value={stats.total_reviews} color="#0077b6" />
      </div>

      <div style={card}>
        <h2 style={{ marginBottom: 16, fontSize: 18 }}>Top Attractions</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
              <th style={{ padding: '8px 12px' }}>Name</th>
              <th style={{ padding: '8px 12px' }}>Category</th>
              <th style={{ padding: '8px 12px' }}>Rating</th>
              <th style={{ padding: '8px 12px' }}>Reviews</th>
            </tr>
          </thead>
          <tbody>
            {stats.top_pois.map((p) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '10px 12px' }}>{p.name}</td>
                <td style={{ padding: '10px 12px', color: '#888' }}>{p.category}</td>
                <td style={{ padding: '10px 12px' }}>⭐ {parseFloat(p.avg_rating).toFixed(1)}</td>
                <td style={{ padding: '10px 12px' }}>{p.review_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...card, borderTop: `4px solid ${color}` }}>
      <p style={{ color: '#888', fontSize: 13, marginBottom: 8 }}>{label}</p>
      <p style={{ fontSize: 36, fontWeight: 800, color }}>{value?.toLocaleString()}</p>
    </div>
  );
}
