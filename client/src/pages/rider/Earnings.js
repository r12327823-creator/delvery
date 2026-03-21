import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function RiderEarnings() {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRiderEarnings()
      .then(result => setEarnings(result))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>My Earnings</h1>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', borderRadius: 12, padding: 24, color: 'white' }}>
          <p style={{ fontSize: 14, opacity: 0.9, marginBottom: 4 }}>Total Earnings</p>
          <p style={{ fontSize: 32, fontWeight: 800 }}>₹{earnings?.total_earnings || 0}</p>
        </div>
        <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 14, color: '#64748b', marginBottom: 4 }}>Deliveries Completed</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#2563eb' }}>{earnings?.total_deliveries || 0}</p>
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Earnings History</h2>
      {(!earnings?.history || earnings.history.length === 0) ? (
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
          <p style={{ color: '#64748b' }}>No earnings yet. Complete deliveries to start earning!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {earnings.history.map(item => (
            <div key={item.id} style={{ background: 'white', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>Order #{item.order_number}</p>
                <p style={{ fontSize: 12, color: '#64748b' }}>{new Date(item.delivered_at).toLocaleDateString('en-IN')}</p>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>₹{item.amount}</span>
            </div>
          ))}
        </div>
      )}

      <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 12 }}>Payouts</h2>
      <div style={{ background: '#fef3c7', padding: 12, borderRadius: 8, color: '#92400e', fontSize: 14 }}>
        💡 Payouts are processed every week by admin. You will receive your earnings via UPI/bank transfer.
      </div>

      {earnings?.payouts?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {earnings.payouts.map(payout => (
            <div key={payout.id} style={{ background: 'white', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>₹{payout.amount}</p>
                <p style={{ fontSize: 12, color: '#64748b' }}>{new Date(payout.created_at).toLocaleDateString('en-IN')}</p>
              </div>
              <span style={{ background: payout.status === 'completed' ? '#dcfce7' : '#fef3c7', color: payout.status === 'completed' ? '#166534' : '#92400e', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {payout.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
