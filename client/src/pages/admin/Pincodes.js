import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function AdminPincodes() {
  const [pincodes, setPincodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ pincode: '', city: '', state: '' });

  useEffect(() => { loadPincodes(); }, []);

  const loadPincodes = async () => {
    try {
      const result = await api.getPincodes();
      setPincodes(result.pincodes || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const addPincode = async (e) => {
    e.preventDefault();
    if (!form.pincode || form.pincode.length !== 6) { alert('Enter valid 6-digit pincode'); return; }
    try {
      await api.addPincode(form);
      setForm({ pincode: '', city: '', state: '' });
      setShowAdd(false);
      loadPincodes();
    } catch (err) { alert(err.message); }
  };

  const togglePincode = async (id, currentStatus) => {
    try {
      await api.updatePincode(id, { is_active: !currentStatus });
      loadPincodes();
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Manage Pincodes</h1>
        <button onClick={() => setShowAdd(!showAdd)} style={{ background: '#7c3aed', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          {showAdd ? 'Cancel' : '+ Add Pincode'}
        </button>
      </div>

      {showAdd && (
        <div style={{ background: 'white', borderRadius: 12, padding: 20, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Add New Pincode</h3>
          <form onSubmit={addPincode} style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Pincode *</label>
              <input type="text" value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="110001" maxLength={6} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>City</label>
              <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="Delhi" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>State</label>
              <input type="text" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} placeholder="Delhi" style={inputStyle} />
            </div>
            <button type="submit" style={{ background: '#7c3aed', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>Add</button>
          </form>
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {pincodes.map(pc => (
            <div key={pc.id} style={{ background: 'white', borderRadius: 10, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div>
                <strong style={{ fontSize: 16 }}>{pc.pincode}</strong>
                <span style={{ marginLeft: 12, color: '#64748b', fontSize: 14 }}>{pc.city} {pc.state && `, ${pc.state}`}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ background: pc.is_active ? '#dcfce7' : '#fee2e2', color: pc.is_active ? '#166534' : '#dc2626', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {pc.is_active ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => togglePincode(pc.id, pc.is_active)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13 }}>
                  {pc.is_active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 };
