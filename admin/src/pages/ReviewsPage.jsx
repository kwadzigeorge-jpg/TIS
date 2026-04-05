import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    setLoading(true);
    api.get('/admin/reviews').then((r) => setReviews(r.data.reviews)).finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const deleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    await api.delete(`/admin/reviews/${id}`);
    fetch();
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, marginBottom: 20 }}>Flagged Reviews</h1>
      {loading ? <p>Loading...</p> : reviews.length === 0 ? (
        <p style={{ color: '#aaa' }}>No flagged reviews. All clear!</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <strong>{r.author_name}</strong>
                  <span style={{ color: '#888', marginLeft: 12, fontSize: 13 }}>on {r.poi_name}</span>
                </div>
                <span style={{ color: '#f4a261' }}>{'⭐'.repeat(r.rating)}</span>
              </div>
              <p style={{ color: '#444', marginBottom: 14 }}>{r.body || <em style={{ color: '#bbb' }}>No text</em>}</p>
              <button
                onClick={() => deleteReview(r.id)}
                style={{ background: '#e53935', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer' }}
              >
                Delete Review
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
