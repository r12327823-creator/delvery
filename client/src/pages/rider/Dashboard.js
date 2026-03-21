import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../utils/api';

export default function RiderDashboard() {
  const [rider, setRider] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [openOrders, setOpenOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const locationIntervalRef = useRef(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadOpenOrders, 10000);
    return () => {
      clearInterval(interval);
      if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
    };
  }, []);

  const loadData = async () => {
    try {
      const profile = await api.getRiderProfile();
      setRider(profile.rider);
      setIsOnline(profile.rider.is_online || false);
      await loadOpenOrders();
      await loadCurrentOrder();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadOpenOrders = async () => {
    try {
      const result = await api.getOpenOrders();
      setOpenOrders(result.orders || []);
    } catch (err) { console.error(err); }
  };

  const loadCurrentOrder = async () => {
    try {
      const result = await api.getCurrentOrder();
      setCurrentOrder(result.order);
    } catch (err) { console.error(err); }
  };

  const toggleOnline = async () => {
    setToggling(true);
    try {
      const newStatus = !isOnline;
      await api.toggleStatus(newStatus);
      setIsOnline(newStatus);

      if (newStatus) {
        // Start sharing location
        startLocationSharing();
      } else {
        // Stop sharing location
        if (locationIntervalRef.current) clearInterval(locationIntervalRef.current);
      }
    } catch (err) { alert(err.message); }
    finally { setToggling(false); }
  };

  const startLocationSharing = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        api.updateLocation(pos.coords.latitude, pos.coords.longitude);
        locationIntervalRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            (p) => api.updateLocation(p.coords.latitude, p.coords.longitude).catch(() => {}),
            () => {},
            { enableHighAccuracy: false, timeout: 10000 }
          );
        }, 15000);
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000 }
    );
  };

  const acceptOrder = async (orderId) => {
    setCountdown(null);
    try {
      await api.acceptOrder(orderId);
      await loadOpenOrders();
      await loadCurrentOrder();
    } catch (err) { alert(err.message); }
  };

  const pickupOrder = async () => {
    if (!currentOrder) return;
    try {
      await api.pickupOrder(currentOrder.id);
      await loadCurrentOrder();
    } catch (err) { alert(err.message); }
  };

  const deliverOrder = async () => {
    if (!currentOrder) return;
    const cashCollected = currentOrder.payment_method === 'cod' ? parseFloat(currentOrder.total_amount) : 0;
    try {
      const result = await api.deliverOrder(currentOrder.id, cashCollected);
      alert(`Delivered! Earned ₹${result.earnings}`);
      setCurrentOrder(null);
      await loadCurrentOrder();
    } catch (err) { alert(err.message); }
  };

  const openMaps = (lat, lng, label) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Online/Offline Toggle */}
      <div style={{
        background: isOnline ? '#22c55e' : '#6b7280',
        borderRadius: 16,
        padding: '32px 24px',
        color: 'white',
        textAlign: 'center',
        marginBottom: 24,
        boxShadow: isOnline ? '0 4px 20px rgba(34,197,94,0.3)' : 'none',
      }}>
        <h1 style={{ fontSize: 14, fontWeight: 500, opacity: 0.9, marginBottom: 12 }}>YOU ARE</h1>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 4 }}>{isOnline ? 'ONLINE' : 'OFFLINE'}</h2>
        <p style={{ fontSize: 14, opacity: 0.8, marginBottom: 20 }}>
          {isOnline ? 'You can see and accept orders' : 'Go online to start receiving orders'}
        </p>
        <button
          onClick={toggleOnline}
          disabled={toggling}
          style={{
            background: isOnline ? '#b91c1c' : '#1d4ed8',
            color: 'white',
            border: '2px solid white',
            padding: '14px 40px',
            borderRadius: 50,
            cursor: 'pointer',
            fontSize: 18,
            fontWeight: 800,
          }}
        >
          {toggling ? '...' : isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
        </button>
        <p style={{ fontSize: 12, opacity: 0.7, marginTop: 8 }}>
          Note: You start OFFLINE every time you log in
        </p>
      </div>

      {/* KYC Status */}
      {rider?.kyc_status !== 'approved' && (
        <div style={{ background: '#fef3c7', padding: 16, borderRadius: 12, marginBottom: 20, color: '#92400e' }}>
          <p style={{ fontWeight: 700, marginBottom: 4 }}>⚠️ KYC Not Approved</p>
          <p style={{ fontSize: 14 }}>Your documents are being reviewed by admin. This takes 24-48 hours.</p>
          {rider?.kyc_status === 'pending' && (
            <p style={{ fontSize: 13, marginTop: 8 }}>Already submitted KYC? Contact admin for status.</p>
          )}
        </div>
      )}

      {/* Current Active Delivery */}
      {currentOrder && (
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Current Delivery 🚴</h2>
          <div style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <strong>Order #{currentOrder.order_number}</strong>
              <span style={{ background: '#dbeafe', color: '#2563eb', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                {currentOrder.status === 'rider_assigned' ? 'Pickup from Shop' : 'Out for Delivery'}
              </span>
            </div>

            {/* Pickup */}
            <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 8, marginBottom: 10 }}>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>📍 PICKUP: {currentOrder.shop_name}</p>
              <p style={{ fontSize: 13 }}>{currentOrder.shop_address}</p>
              <button onClick={() => openMaps(currentOrder.pickup_lat, currentOrder.pickup_lng, 'Shop')} style={{ marginTop: 6, background: '#22c55e', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                🗺️ Navigate to Shop
              </button>
            </div>

            {/* Drop */}
            <div style={{ background: '#eff6ff', padding: 12, borderRadius: 8, marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#64748b', marginBottom: 2 }}>🏠 DELIVER: {currentOrder.customer_name}</p>
              <p style={{ fontSize: 13 }}>{currentOrder.drop_address}</p>
              <button onClick={() => openMaps(currentOrder.drop_lat, currentOrder.drop_lng, 'Customer')} style={{ marginTop: 6, background: '#2563eb', color: 'white', border: 'none', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                🗺️ Navigate to Customer
              </button>
            </div>

            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
              Items: {currentOrder.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
            </p>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
              Total: ₹{currentOrder.total_amount} {currentOrder.payment_method === 'cod' && `(Collect ₹${currentOrder.total_amount} cash)`}
            </p>

            {currentOrder.status === 'rider_assigned' && (
              <button onClick={pickupOrder} style={{ width: '100%', background: '#22c55e', color: 'white', padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
                ✅ Picked Up from Shop
              </button>
            )}
            {currentOrder.status === 'picked_up' && (
              <button onClick={deliverOrder} style={{ width: '100%', background: '#059669', color: 'white', padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
                🏠 Delivered! Confirm
              </button>
            )}
          </div>
        </div>
      )}

      {/* Open Orders Board */}
      {isOnline && !currentOrder && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Open Orders 📋 ({openOrders.length})
          </h2>
          {openOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
              <p style={{ color: '#64748b' }}>No open orders in your area right now.<br />New orders appear here automatically.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {openOrders.map(order => (
                <div key={order.id} style={{ background: 'white', borderRadius: 10, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <strong>#{order.order_number}</strong>
                    <span style={{ background: '#dcfce7', color: '#166534', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>Ready for Pickup</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#64748b' }}>📍 {order.shop_name}</p>
                  <p style={{ fontSize: 13, color: '#64748b' }}>🏠 {order.drop_address}</p>
                  <p style={{ fontSize: 13, marginTop: 6 }}>
                    Items: {order.items?.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>₹30 Earning</span>
                    <button onClick={() => acceptOrder(order.id)} style={{ background: '#2563eb', color: 'white', padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                      Accept 🚀
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isOnline && !currentOrder && (
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📵</div>
          <p style={{ color: '#64748b' }}>Go ONLINE to see available orders near you</p>
        </div>
      )}
    </div>
  );
}
