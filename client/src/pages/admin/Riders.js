import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function AdminRiders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => { loadRiders(); }, [filter]);

  const loadRiders = async () => {
    try {
      const result = await api.getAdminRiders(filter !== 'all' ? filter : null);
      setRiders(result.riders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateRider = async (id, data) => {
    try {
      await api.updateRider(id, data);
      loadRiders();
    } catch (err) { alert(err.message); }
  };

  const tabs = ['pending', 'approved', 'rejected', 'all'];
  const statusColors = { pending: '#eab308', approved: '#22c55e', rejected: '#ef4444' };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Manage Riders</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setFilter(tab)} style={{ background: filter === tab ? '#7c3aed' : 'white', color: filter === tab ? 'white' : '#374151', border: '1px solid #e2e8f0', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>
            {tab}
          </button>
        ))}
      </div>

      {loading ? <p>Loading...</p> : riders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚴</div>
          <p style={{ color: '#64748b' }}>No {filter} riders</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {riders.map(rider => (
            <div key={rider.id} style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{rider.name}</h3>
                  <p style={{ fontSize: 13, color: '#64748b' }}>{rider.mobile} • {rider.pincode}</p>
                  <p style={{ fontSize: 13, color: '#64748b' }}>Deliveries: {rider.total_deliveries} • {rider.is_online ? '🟢 Online' : '⚫ Offline'}</p>
                  {rider.kyc_notes && <p style={{ fontSize: 12, color: '#ef4444' }}>Note: {rider.kyc_notes}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ background: `${statusColors[rider.kyc_status] || '#6b7280'}15`, color: statusColors[rider.kyc_status] || '#6b7280', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'capitalize', display: 'block' }}>
                    KYC: {rider.kyc_status}
                  </span>
                  {rider.approved_at && <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>Approved: {new Date(rider.approved_at).toLocaleDateString('en-IN')}</p>}
                </div>
              </div>

              {/* KYC Documents */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                {rider.aadhaar_front && <a href={rider.aadhaar_front} target="_blank" rel="noreferrer" style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: 6, fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>📄 Aadhaar Front</a>}
                {rider.aadhaar_back && <a href={rider.aadhaar_back} target="_blank" rel="noreferrer" style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: 6, fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>📄 Aadhaar Back</a>}
                {rider.selfie && <a href={rider.selfie} target="_blank" rel="noreferrer" style={{ background: '#f3f4f6', padding: '4px 10px', borderRadius: 6, fontSize: 12, color: '#2563eb', textDecoration: 'none' }}>📸 Selfie</a>}
              </div>

              {filter === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => updateRider(rider.id, { kyc_status: 'approved' })} style={{ flex: 1, background: '#22c55e', color: 'white', padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                    ✅ Approve KYC
                  </button>
                  <button onClick={() => { const note = prompt('Rejection reason:'); if (note) updateRider(rider.id, { kyc_status: 'rejected', kyc_notes: note }); }} style={{ flex: 1, background: '#ef4444', color: 'white', padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                    ❌ Reject
                  </button>
                </div>
              )}

              {filter === 'approved' && (
                <button onClick={() => updateRider(rider.id, { is_active: !rider.is_active })} style={{ background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  {rider.is_active ? '🚫 Deactivate' : '✅ Activate'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
