import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function VendorDashboard() {
  const [vendor, setVendor] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const audioRef = React.useRef(null);

  useEffect(() => {
    loadData();
    // Poll for new orders every 10s
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const profile = await api.getVendorProfile();
      setVendor(profile.vendor);
      await loadOrders();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const result = await api.getVendorOrders();
      const newOrders = result.orders?.filter(o => ['placed', 'accepted', 'ready_for_pickup'].includes(o.status)) || [];
      setOrders(newOrders);

      // Play sound on new order
      if (newOrders.length > 0 && audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOrder = async (orderId, action) => {
    try {
      if (action === 'accept') await api.acceptOrder(orderId);
      else if (action === 'ready') await api.readyOrder(orderId);
      else if (action === 'reject') {
        const reason = prompt('Reason for rejection:');
        if (reason) await api.rejectOrder(orderId, reason);
        else return;
      }
      await loadOrders();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const mins = Math.floor((Date.now() - new Date(dateStr)) / 60000);
    return mins < 1 ? 'Just now' : `${mins}m ago`;
  };

  if (loading) return <div>Loading...</div>;

  const pendingOrders = orders.filter(o => o.status === 'placed');
  const activeOrders = orders.filter(o => ['accepted', 'ready_for_pickup'].includes(o.status));

  return (
    <div>
      {/* Hidden audio for new order alerts */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleWctZrTI25xYQS1grMzjnlE6aa3R5KKFWT5ur9XmmV09crLd5pZSOTBzst/mllE8c7Pi5ZhVPnS14OaYVT53teHmmFU+ebXi5phVP3q24+WYVT97tuPlmFU/e7bj5ZhVP3y25OWYVT99tuTl" />

      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Vendor Dashboard</h1>
      {vendor?.status === 'pending' && (
        <div style={{ background: '#fef3c7', padding: 12, borderRadius: 8, marginBottom: 16, color: '#92400e', fontSize: 14 }}>
          ⚠️ Your shop is awaiting admin approval. You can add products but cannot receive orders yet.
        </div>
      )}
      {vendor?.status === 'approved' && (
        <div style={{ background: '#dcfce7', padding: 12, borderRadius: 8, marginBottom: 16, color: '#166534', fontSize: 14 }}>
          ✅ Your shop is live and accepting orders!
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 13, color: '#64748b' }}>New Orders</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#3b82f6' }}>{pendingOrders.length}</p>
        </div>
        <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <p style={{ fontSize: 13, color: '#64748b' }}>Active</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#eab308' }}>{activeOrders.length}</p>
        </div>
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Incoming Orders 🔔</h2>

      {pendingOrders.length === 0 && activeOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ color: '#64748b' }}>No pending orders. New orders will appear here with a sound alert.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {pendingOrders.map(order => (
            <div key={order.id} style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              borderLeft: '4px solid #3b82f6',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <strong>Order #{order.order_number}</strong>
                  <p style={{ fontSize: 13, color: '#64748b' }}>{order.customer_name} • {order.customer_mobile}</p>
                  <p style={{ fontSize: 13, color: '#64748b' }}>{formatTime(order.created_at)}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 18, fontWeight: 700 }}>₹{order.total_amount}</p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>{order.payment_method.toUpperCase()}</p>
                </div>
              </div>

              <div style={{ marginBottom: 12, background: '#f8fafc', padding: 10, borderRadius: 6 }}>
                {order.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span>{item.quantity}x {item.name}</span>
                    <span>₹{parseFloat(item.price) * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleOrder(order.id, 'accept')}
                  style={{ flex: 1, background: '#22c55e', color: 'white', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  ✅ Accept
                </button>
                <button
                  onClick={() => handleOrder(order.id, 'reject')}
                  style={{ flex: 1, background: '#ef4444', color: 'white', padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}

          {activeOrders.map(order => (
            <div key={order.id} style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              borderLeft: '4px solid #eab308',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>Order #{order.order_number}</strong>
                  <p style={{ fontSize: 13, color: '#64748b' }}>{order.customer_name}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                    {order.status === 'accepted' ? 'Accepted - Preparing' : 'Ready for Pickup'}
                  </span>
                  {order.status === 'accepted' && (
                    <button
                      onClick={() => handleOrder(order.id, 'ready')}
                      style={{ background: '#059669', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      Mark Ready 🚀
                    </button>
                  )}
                  {order.status === 'ready_for_pickup' && (
                    <span style={{ color: '#64748b', fontSize: 13 }}>Waiting for rider...</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
