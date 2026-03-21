import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function AdminPayouts() {
  const [payouts, setPayouts] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rider_id: '', amount: '', method: 'upi', transaction_id: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [payoutsRes, ridersRes] = await Promise.all([
        api.getPayouts(),
        api.getAdminRiders('approved'),
      ]);
      setPayouts(payoutsRes.payouts || []);
      setRiders(ridersRes.riders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const createPayout = async (e) => {
    e.preventDefault();
    if (!form.rider_id || !form.amount) return;
    try {
      await api.createPayout(form);
      setForm({ rider_id: '', amount: '', method: 'upi', transaction_id: '' });
      loadData();
      alert('Payout processed successfully!');
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Manage Payouts</h1>

      {/* Create Payout */}
      <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Process New Payout</h3>
        <form onSubmit={createPayout} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Select Rider</label>
            <select value={form.rider_id} onChange={e => setForm(f => ({ ...f, rider_id: e.target.value }))} style={selectStyle}>
              <option value="">Choose rider...</option>
              {riders.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.mobile})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Amount (₹)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="500" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Method</label>
            <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} style={selectStyle}>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Transaction ID</label>
            <input type="text" value={form.transaction_id} onChange={e => setForm(f => ({ ...f, transaction_id: e.target.value }))} placeholder="UPI ref" style={inputStyle} />
          </div>
          <button type="submit" style={{ background: '#7c3aed', color: 'white', padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
            Pay Now
          </button>
        </form>
      </div>

      {/* Payout History */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Payout History</h2>
      {loading ? <p>Loading...</p> : payouts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
          <p style={{ color: '#64748b' }}>No payouts processed yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {payouts.map(payout => (
            <div key={payout.id} style={{ background: 'white', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>{payout.name} ({payout.mobile})</p>
                <p style={{ fontSize: 12, color: '#64748b' }}>{new Date(payout.created_at).toLocaleDateString('en-IN')} • {payout.method.toUpperCase()} {payout.transaction_id && `• Ref: ${payout.transaction_id}`}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>₹{payout.amount}</span>
                <span style={{ display: 'block', background: payout.status === 'completed' ? '#dcfce7' : '#fef3c7', color: payout.status === 'completed' ? '#166534' : '#92400e', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, marginTop: 4 }}>
                  {payout.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 };
const selectStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 };
