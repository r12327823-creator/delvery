import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      const result = await api.getDashboard();
      setStats(result);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <div>Loading...</div>;

  const cards = [
    { label: 'Orders Today', value: stats.orders_today, color: '#2563eb', bg: '#dbeafe' },
    { label: 'Orders This Week', value: stats.orders_week, color: '#7c3aed', bg: '#ede9fe' },
    { label: 'Active Vendors', value: stats.active_vendors, color: '#059669', bg: '#dcfce7' },
    { label: 'Active Riders', value: stats.active_riders, color: '#d97706', bg: '#fef3c7' },
    { label: 'Riders Online', value: stats.riders_online, color: '#dc2626', bg: '#fee2e2' },
    { label: 'Total Customers', value: stats.total_customers, color: '#0891b2', bg: '#cffafe' },
    { label: 'Pending Vendors', value: stats.pending_vendors, color: '#eab308', bg: '#fef9c3' },
    { label: 'Pending KYC', value: stats.pending_kyc, color: '#f97316', bg: '#ffedd5' },
    { label: 'Completed Orders', value: stats.completed_orders, color: '#22c55e', bg: '#dcfce7' },
    { label: 'Revenue (Platform)', value: `₹${stats.revenue_today.toFixed(0)}`, color: '#7c3aed', bg: '#ede9fe' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Admin Dashboard</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {cards.map(card => (
          <div key={card.label} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{card.label}</p>
            <p style={{ fontSize: 28, fontWeight: 800, color: card.color }}>{card.value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a href="/admin/pincodes" style={{ background: '#f3f4f6', padding: '10px 16px', borderRadius: 8, textDecoration: 'none', color: '#374151', fontSize: 14, fontWeight: 600 }}>
              📍 Manage Pincodes
            </a>
            <a href="/admin/vendors?status=pending" style={{ background: stats.pending_vendors > 0 ? '#fef3c7' : '#f3f4f6', padding: '10px 16px', borderRadius: 8, textDecoration: 'none', color: stats.pending_vendors > 0 ? '#92400e' : '#374151', fontSize: 14, fontWeight: 600 }}>
              🏪 Approve Vendors {stats.pending_vendors > 0 && `(${stats.pending_vendors})`}
            </a>
            <a href="/admin/riders?kyc_status=pending" style={{ background: stats.pending_kyc > 0 ? '#fef3c7' : '#f3f4f6', padding: '10px 16px', borderRadius: 8, textDecoration: 'none', color: stats.pending_kyc > 0 ? '#92400e' : '#374151', fontSize: 14, fontWeight: 600 }}>
              🚴 Review KYC {stats.pending_kyc > 0 && `(${stats.pending_kyc})`}
            </a>
            <a href="/admin/settings" style={{ background: '#f3f4f6', padding: '10px 16px', borderRadius: 8, textDecoration: 'none', color: '#374151', fontSize: 14, fontWeight: 600 }}>
              ⚙️ Platform Settings
            </a>
            <a href="/admin/payouts" style={{ background: '#f3f4f6', padding: '10px 16px', borderRadius: 8, textDecoration: 'none', color: '#374151', fontSize: 14, fontWeight: 600 }}>
              💰 Manage Payouts
            </a>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Platform Summary</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Orders (Month)</span>
              <strong>{stats.orders_month}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Pending Orders</span>
              <strong style={{ color: '#eab308' }}>{stats.pending_orders}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Completion Rate</span>
              <strong style={{ color: '#22c55e' }}>
                {stats.completed_orders > 0
                  ? ((stats.completed_orders / (stats.completed_orders + stats.pending_orders)) * 100).toFixed(1)
                  : 0}%
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Platform Revenue (Today)</span>
              <strong style={{ color: '#7c3aed' }}>₹{stats.revenue_today.toFixed(0)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
