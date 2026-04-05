import React, { useEffect, useState } from 'react';
import api from '../services/api';

const btn = (color = '#1a6b3c') => ({
  background: color, color: '#fff', border: 'none',
  borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontSize: 13,
});

export default function POIsPage() {
  const [pois, setPois] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPOIs = (q = '') => {
    setLoading(true);
    api.get(`/admin/pois${q ? `?search=${q}` : ''}`)
      .then((r) => setPois(r.data.pois))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPOIs(); }, []);

  const toggleActive = async (poi) => {
    await api.patch(`/admin/pois/${poi.id}`, { is_active: !poi.is_active });
    fetchPOIs(search);
  };

  const toggleVerified = async (poi) => {
    await api.patch(`/admin/pois/${poi.id}`, { is_verified: !poi.is_verified });
    fetchPOIs(search);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24 }}>Points of Interest</h1>
      </div>

      <div style={{ marginBottom: 16 }}>
        <input
          style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, width: 280 }}
          placeholder="Search POIs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchPOIs(search)}
        />
        <button style={{ ...btn(), marginLeft: 8 }} onClick={() => fetchPOIs(search)}>Search</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #eee' }}>
                {['Name', 'City', 'Category', 'Rating', 'Active', 'Verified', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, color: '#555' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pois.map((poi) => (
                <tr key={poi.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{poi.name}</td>
                  <td style={{ padding: '12px 16px', color: '#888' }}>{poi.city}</td>
                  <td style={{ padding: '12px 16px' }}>{poi.category}</td>
                  <td style={{ padding: '12px 16px' }}>⭐ {parseFloat(poi.avg_rating || 0).toFixed(1)}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: poi.is_active ? '#1a6b3c' : '#e53935', fontWeight: 600 }}>
                      {poi.is_active ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: poi.is_verified ? '#0077b6' : '#888' }}>
                      {poi.is_verified ? '✓' : '–'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', display: 'flex', gap: 8 }}>
                    <button style={btn(poi.is_active ? '#e53935' : '#1a6b3c')} onClick={() => toggleActive(poi)}>
                      {poi.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button style={btn('#0077b6')} onClick={() => toggleVerified(poi)}>
                      {poi.is_verified ? 'Unverify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pois.length === 0 && <p style={{ padding: 24, color: '#aaa', textAlign: 'center' }}>No POIs found.</p>}
        </div>
      )}
    </div>
  );
}
