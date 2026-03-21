import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const statusSteps = [
  { key: 'placed', label: 'Order Placed', icon: '📋' },
  { key: 'accepted', label: 'Accepted', icon: '✅' },
  { key: 'ready_for_pickup', label: 'Ready', icon: '📦' },
  { key: 'picked_up', label: 'Picked Up', icon: '🚴' },
  { key: 'delivered', label: 'Delivered', icon: '🏠' },
];

export default function CustomerTrackOrder() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    loadOrder();
    const interval = setInterval(loadRiderLocation, 15000); // Poll every 15s
    return () => clearInterval(interval);
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const result = await api.getOrder(orderId);
      setOrder(result.order);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadRiderLocation = async () => {
    if (!order || !order.rider_id) return;
    try {
      const result = await api.getRiderLocation(orderId);
      setRiderLocation(result.location);
      updateMapMarker(result.location);
    } catch (err) {
      console.error(err);
    }
  };

  const initMap = (location) => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const L = window.L;
    mapInstanceRef.current = L.map(mapRef.current).setView(
      [location.drop_lat || 0, location.drop_lng || 0],
      14
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(mapInstanceRef.current);

    // Drop marker (customer)
    if (location.drop_lat && location.drop_lng) {
      L.marker([location.drop_lat, location.drop_lng])
        .addTo(mapInstanceRef.current)
        .bindPopup('Delivery Location 🏠')
        .openPopup();
    }
  };

  const updateMapMarker = (location) => {
    if (!mapInstanceRef.current || !location.current_lat) return;
    const L = window.L;
    // Remove old rider marker if exists
    if (mapInstanceRef.current._riderMarker) {
      mapInstanceRef.current.removeLayer(mapInstanceRef.current._riderMarker);
    }
    // Add rider marker
    mapInstanceRef.current._riderMarker = L.marker([location.current_lat, location.current_lng])
      .addTo(mapInstanceRef.current)
      .bindPopup('Rider is here 🚴')
      .openPopup();
  };

  useEffect(() => {
    if (riderLocation && riderLocation.drop_lat) {
      initMap(riderLocation);
    }
  }, [riderLocation]);

  const getStepIndex = (status) => {
    const index = statusSteps.findIndex(s => s.key === status);
    return index >= 0 ? index : 0;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  if (loading) return <div>Loading...</div>;
  if (!order) return <div>Order not found</div>;

  return (
    <div>
      <button onClick={() => navigate(-1)} style={{
        background: 'none',
        border: 'none',
        color: '#2563eb',
        cursor: 'pointer',
        fontSize: 14,
        marginBottom: 16,
      }}>
        ← Back
      </button>

      {/* Order Info */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Order #{order.order_number}</h2>
          <span style={{
            background: '#dbeafe',
            color: '#2563eb',
            padding: '4px 12px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'capitalize',
          }}>
            {order.status.replace(/_/g, ' ')}
          </span>
        </div>
        <p style={{ fontSize: 14, color: '#64748b' }}>{order.shop_name}</p>
        <p style={{ fontSize: 13, color: '#64748b' }}>Placed: {formatDate(order.created_at)}</p>
      </div>

      {/* Status Timeline */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Order Status</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {statusSteps.map((step, idx) => {
            const currentIdx = getStepIndex(order.status);
            const isCompleted = idx < currentIdx;
            const isActive = idx === currentIdx;
            const isPending = idx > currentIdx;

            return (
              <div key={step.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isCompleted || isActive ? '#2563eb' : '#e2e8f0',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  flexShrink: 0,
                }}>
                  {isCompleted ? '✓' : step.icon}
                </div>
                <div style={{ paddingBottom: idx < statusSteps.length - 1 ? 20 : 0 }}>
                  <p style={{
                    fontWeight: isActive ? 700 : 500,
                    color: isPending ? '#94a3b8' : '#1e293b',
                    fontSize: 14,
                  }}>
                    {step.label}
                  </p>
                  {isActive && order.status === 'placed' && order.accepted_at && (
                    <p style={{ fontSize: 12, color: '#64748b' }}>{formatDate(order.accepted_at)}</p>
                  )}
                </div>
                {idx < statusSteps.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: 15,
                    width: 2,
                    height: 20,
                    background: isCompleted ? '#2563eb' : '#e2e8f0',
                    marginTop: 32,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rider Info */}
      {order.rider_name && (
        <div style={{
          background: 'white',
          borderRadius: 12,
          padding: 20,
          marginBottom: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Your Rider</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}>
              🚴
            </div>
            <div>
              <p style={{ fontWeight: 700 }}>{order.rider_name}</p>
              <p style={{ fontSize: 13, color: '#64748b' }}>{order.rider_mobile}</p>
            </div>
            {order.rider_mobile && (
              <a
                href={`tel:${order.rider_mobile}`}
                style={{
                  marginLeft: 'auto',
                  background: '#22c55e',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                📞 Call
              </a>
            )}
          </div>
        </div>
      )}

      {/* Live Map */}
      {order.status !== 'delivered' && order.status !== 'rejected' && (
        <div style={{
          background: 'white',
          borderRadius: 12,
          overflow: 'hidden',
          marginBottom: 20,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Live Tracking</h3>
          </div>
          <div ref={mapRef} id="map" style={{ height: 300, width: '100%' }} />
        </div>
      )}

      {/* Order Details */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Order Details</h3>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Delivery Address</p>
          <p style={{ fontSize: 14, fontWeight: 600 }}>{order.drop_address}</p>
        </div>
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Items</p>
          {order.items?.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>{item.quantity}x {item.name}</span>
              <span>₹{parseFloat(item.price) * item.quantity}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 12, marginTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal</span><span>₹{order.subtotal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span>Delivery Fee</span><span>₹{order.delivery_fee}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 16 }}>
            <span>Total</span><span>₹{order.total_amount}</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
          Payment: {order.payment_method.toUpperCase()} {order.payment_status === 'paid' && '✓ Paid'}
        </p>
      </div>
    </div>
  );
}
