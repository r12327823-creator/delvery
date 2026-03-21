import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => { loadVendors(); }, [filter]);

  const loadVendors = async () => {
    try {
      const result = await api.getAdminVendors(filter !== 'all' ? filter : null);
      setVendors(result.vendors || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const updateVendor = async (id, data) => {
    try {
      await api.updateVendor(id, data);
      loadVendors();
    } catch (err) { alert(err.message); }
  };

  const tabs = ['pending', 'approved', 'rejected', 'suspended', 'all'];
  const statusColors = { pending: '#eab308', approved: '#22c55e', rejected: '#ef4444', suspended: '#6b7280' };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Manage Vendors</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            style={{
              background: filter === tab ? '#7c3aed' : 'white',
              color: filter === tab ? 'white' : '#374151',
              border: '1px solid #e2e8f0',
              padding: '8px 16px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: 13,
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? <p>Loading...</p> : vendors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <p style={{ color: '#64748b' }}>No {filter} vendors</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {vendors.map(vendor => (
            <div key={vendor.id} style={{ background: 'white', borderRadius: 10, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700 }}>{vendor.shop_name}</h3>
                  <p style={{ fontSize: 13, color: '#64748b' }}>{vendor.name} • {vendor.mobile} • {vendor.pincode}</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Category: {vendor.category}</p>
                  {vendor.admin_notes && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Note: {vendor.admin_notes}</p>}
                </div>
                <span style={{ background: `${statusColors[vendor.status] || '#6b7280'}15`, color: statusColors[vendor.status] || '#6b7280', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' }}>
                  {vendor.status}
                </span>
              </div>

              {filter === 'pending' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => updateVendor(vendor.id, { status: 'approved' })} style={{ flex: 1, background: '#22c55e', color: 'white', padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                    ✅ Approve
                  </button>
                  <button onClick={() => { const note = prompt('Rejection reason:'); if (note) updateVendor(vendor.id, { status: 'rejected', admin_notes: note }); }} style={{ flex: 1, background: '#ef4444', color: 'white', padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                    ❌ Reject
                  </button>
                </div>
              )}

              {(filter === 'approved' || filter === 'suspended') && (
                <button onClick={() => updateVendor(vendor.id, { status: vendor.status === 'approved' ? 'suspended' : 'approved' })} style={{ background: vendor.status === 'approved' ? '#ef4444' : '#22c55e', color: 'white', padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
                  {vendor.status === 'approved' ? '🚫 Suspend' : '✅ Activate'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
