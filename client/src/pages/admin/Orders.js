import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [riders, setRiders] = useState([]);

  useEffect(() => { loadOrders(); loadRiders(); }, [filter]);

  const loadOrders = async () => {
    try {
      const result = await api.getAdminOrders(filter || null);
      setOrders(result.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadRiders = async () => {
    try {
      const result = await api.getAdminRiders('approved');
      setRiders(result.riders || []);
    } catch (err) { console.error(err); }
  };

  const assignRider = async (orderId, riderId) => {
    if (!riderId) return;
    try {
      await api.assignRider(orderId, riderId);
      loadOrders();
    } catch (err) { alert(err.message); }
  };

  const statusColors = {
    placed: '#3b82f6', accepted: '#22c55e', ready_for_pickup: '#eab308',
    rider_assigned: '#8b5cf6', picked_up: '#f97316', out_for_delivery: '#f97316',
    delivered: '#059669', rejected: '#ef4444', waiting_rider: '#6b7280', cancelled: '#ef4444',
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>All Orders</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {['', 'placed', 'accepted', 'ready_for_pickup', 'waiting_rider', 'delivered', 'rejected'].map(s => (
          <button key={s || 'all'} onClick={() => setFilter(s)} style={{ background: filter === s ? '#7c3aed' : 'white', color: filter === s ? 'white' : '#374151', border: '1px solid #e2e8f0', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13, textTransform: 'capitalize' }}>
            {s.replace(/_/g, ' ') || 'All'}
          </button>
        ))}
      </div>

      {loading ? <p>Loading...</p> : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ color: '#64748b' }}>No orders found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <strong>#{order.order_number}</strong>
                  <p style={{ fontSize: 12, color: '#64748b' }}>{order.shop_name}</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Customer: {order.customer_name} • {order.customer_mobile}</p>
                  {order.rider_name && <p style={{ fontSize: 12, color: '#64748b' }}>Rider: {order.rider_name}</p>}
                  {order.rejection_reason && <p style={{ fontSize: 12, color: '#ef4444' }}>Rejected: {order.rejection_reason}</p>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ background: `${statusColors[order.status] || '#6b7280'}15`, color: statusColors[order.status] || '#6b7280', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', display: 'block' }}>
                    {order.status.replace(/_/g, ' ')}
                  </span>
                  <strong style={{ fontSize: 16, marginTop: 4, display: 'block' }}>₹{order.total_amount}</strong>
                </div>
              </div>

              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                {new Date(order.created_at).toLocaleString('en-IN')} • {order.payment_method.toUpperCase()} {order.payment_status === 'paid' ? '✓' : ''}
              </p>

              {order.status === 'waiting_rider' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select onChange={e => assignRider(order.id, e.target.value)} defaultValue="" style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 13 }}>
                    <option value="">Assign Rider...</option>
                    {riders.filter(r => r.is_active).map(r => (
                      <option key={r.id} value={r.id}>{r.name} ({r.mobile})</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
