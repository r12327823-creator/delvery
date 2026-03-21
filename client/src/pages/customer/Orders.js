import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../utils/api';

const statusSteps = [
  { key: 'placed', label: 'Placed', icon: '📋' },
  { key: 'accepted', label: 'Accepted', icon: '✅' },
  { key: 'ready_for_pickup', label: 'Ready', icon: '📦' },
  { key: 'picked_up', label: 'Picked Up', icon: '🚴' },
  { key: 'delivered', label: 'Delivered', icon: '🏠' },
];

const statusColors = {
  placed: '#3b82f6',
  accepted: '#22c55e',
  ready_for_pickup: '#eab308',
  picked_up: '#f97316',
  out_for_delivery: '#f97316',
  delivered: '#059669',
  rejected: '#ef4444',
  waiting_rider: '#6b7280',
};

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const result = await api.getOrders();
      setOrders(result.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStepIndex = (status) => {
    return statusSteps.findIndex(s => s.key === status);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>My Orders</h1>

      {loading ? (
        <p>Loading orders...</p>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>📦</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No orders yet</h2>
          <p style={{ color: '#64748b' }}>Place your first order and it will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
            <Link
              key={order.id}
              to={`/customer/track/${order.id}`}
              style={{
                background: 'white',
                borderRadius: 12,
                padding: 20,
                textDecoration: 'none',
                color: '#1e293b',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700 }}>{order.shop_name}</h3>
                  <p style={{ fontSize: 13, color: '#64748b' }}>
                    Order #{order.order_number} • {formatDate(order.created_at)}
                  </p>
                </div>
                <span style={{
                  background: `${statusColors[order.status] || '#6b7280'}15`,
                  color: statusColors[order.status] || '#6b7280',
                  padding: '4px 12px',
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: 'capitalize',
                }}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Status Progress */}
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {statusSteps.map((step, idx) => {
                  const currentIdx = getStepIndex(order.status);
                  const isCompleted = idx <= currentIdx;
                  const isActive = idx === currentIdx;
                  return (
                    <div
                      key={step.key}
                      style={{
                        flex: 1,
                        height: 4,
                        borderRadius: 2,
                        background: isCompleted ? statusColors[order.status] : '#e2e8f0',
                        opacity: isActive ? 1 : 0.5,
                      }}
                    />
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  {order.items?.length || 0} item(s)
                </span>
                <span style={{ fontSize: 16, fontWeight: 700 }}>₹{order.total_amount}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
