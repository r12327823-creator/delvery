import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function VendorOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    try {
      const result = await api.getVendorOrders();
      setOrders(result.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const statusColors = {
    placed: '#3b82f6', accepted: '#22c55e', ready_for_pickup: '#eab308',
    picked_up: '#f97316', delivered: '#059669', rejected: '#ef4444',
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>All Orders</h1>
      {loading ? <p>Loading...</p> : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ color: '#64748b' }}>No orders yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(order => (
            <div key={order.id} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <strong>#{order.order_number}</strong>
                <span style={{ background: `${statusColors[order.status] || '#6b7280'}15`, color: statusColors[order.status] || '#6b7280', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#64748b' }}>{order.customer_name} • {order.customer_mobile}</p>
              <p style={{ fontSize: 13, color: '#64748b' }}>{new Date(order.created_at).toLocaleString('en-IN')}</p>
              <div style={{ marginTop: 8 }}>
                {order.items?.map((item, idx) => (
                  <p key={idx} style={{ fontSize: 13 }}>{item.quantity}x {item.name}</p>
                ))}
              </div>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                <span>{order.payment_method.toUpperCase()} {order.payment_status === 'paid' ? '✓' : ''}</span>
                <strong>₹{order.total_amount}</strong>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
