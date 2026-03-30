import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

export default function CustomerCart() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('m2h_cart') || '[]');
    setCart(savedCart);
  }, []);

  const updateQuantity = (productId, delta) => {
    const newCart = cart.map(item => {
      if (item.product_id === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0);
    setCart(newCart);
    localStorage.setItem('m2h_cart', JSON.stringify(newCart));
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const deliveryFee = 40;
  const total = subtotal + deliveryFee;

  const placeOrder = async () => {
    if (!address.trim()) {
      setError('Please enter your delivery address');
      return;
    }
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Place order for the vendor
      const result = await api.placeOrder({
        vendor_id: cart[0].vendor_id,
        items: cart.map(item => ({
          product_id: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        drop_address: address,
        payment_method: paymentMethod,
        pincode: localStorage.getItem('m2h_pincode'),
      });

      // Clear cart
      localStorage.removeItem('m2h_cart');
      navigate(`/customer/track/${result.order.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🛒</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Your cart is empty</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Add items from a shop to get started</p>
        <button
          onClick={() => navigate('/customer')}
          style={{
            background: '#2563eb',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: 8,
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
          }}
        >
          Search for items
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
      {/* Cart Items */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Your Cart</h1>
        <p style={{ color: '#64748b', marginBottom: 16 }}>From: {cart[0]?.vendor_name}</p>

        {cart.map(item => (
          <div key={item.product_id} style={{
            background: 'white',
            borderRadius: 10,
            padding: 16,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            {item.image && (
              <img src={item.image} alt={item.name} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600 }}>{item.name}</h3>
              <p style={{ color: '#2563eb', fontWeight: 700 }}>₹{item.price}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => updateQuantity(item.product_id, -1)}
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 16 }}
              >
                −
              </button>
              <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.product_id, 1)}
                style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 16 }}
              >
                +
              </button>
            </div>
            <span style={{ fontWeight: 700, minWidth: 60, textAlign: 'right' }}>₹{item.price * item.quantity}</span>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        position: 'sticky',
        top: 80,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Order Summary</h2>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Delivery Address</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter your complete delivery address"
            rows={3}
            style={{
              width: '100%',
              marginTop: 6,
              padding: '10px 12px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 14,
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, display: 'block' }}>Payment Method</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
              <span>💵 Cash on Delivery (COD)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="radio" name="payment" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
              <span>📱 UPI / Online Payment</span>
            </label>
          </div>
        </div>

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span>Delivery Fee</span>
            <span>₹{deliveryFee}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
            <span>Total</span>
            <span>₹{total}</span>
          </div>
        </div>

        {error && <p style={{ color: '#ef4444', marginTop: 12, fontSize: 14 }}>{error}</p>}

        <button
          onClick={placeOrder}
          disabled={loading}
          style={{
            width: '100%',
            marginTop: 16,
            background: '#059669',
            color: 'white',
            padding: '14px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 16,
            fontWeight: 700,
          }}
        >
          {loading ? 'Placing Order...' : 'Place Order'}
        </button>

        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
          No minimum order value • Delivery within 60 minutes
        </p>
      </div>
    </div>
  );
}
