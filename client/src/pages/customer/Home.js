import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const categories = [
  { name: 'Groceries', icon: '🛒', color: '#22c55e' },
  { name: 'Medicine', icon: '💊', color: '#ef4444' },
  { name: 'Food', icon: '🍔', color: '#f97316' },
  { name: 'Bakery', icon: '🍞', color: '#eab308' },
  { name: 'Hardware', icon: '🔧', color: '#6b7280' },
  { name: 'Stationery', icon: '📚', color: '#3b82f6' },
];

export default function CustomerHome() {
  const navigate = useNavigate();
  const [pincode, setPincode] = useState(localStorage.getItem('m2h_pincode') || '');
  const [serviceAvailable, setServiceAvailable] = useState(null);
  const [checking, setChecking] = useState(false);
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState([]);
  const [loadingVendors, setLoadingVendors] = useState(false);

  const checkPincode = async () => {
    if (!pincode || pincode.length !== 6) return;
    setChecking(true);
    try {
      const result = await api.checkPincode(pincode);
      setServiceAvailable(result.available);
      localStorage.setItem('m2h_pincode', pincode);
      if (result.available) {
        loadVendors();
      }
    } catch (err) {
      setServiceAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  const loadVendors = async () => {
    setLoadingVendors(true);
    try {
      const result = await api.getVendors({ pincode });
      setVendors(result.vendors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVendors(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/customer/vendors?q=${encodeURIComponent(search)}`);
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        borderRadius: 16,
        padding: '48px 32px',
        color: 'white',
        marginBottom: 32,
      }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
          Anything from your neighbourhood,<br />delivered to your door
        </h1>
        <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 24 }}>
          Local shops. Local riders. Fast delivery.
        </p>

        {/* Pincode Check */}
        <div style={{ display: 'flex', gap: 8, maxWidth: 500 }}>
          <input
            type="text"
            placeholder="Enter your pincode"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              fontSize: 16,
            }}
          />
          <button
            onClick={checkPincode}
            disabled={checking}
            style={{
              background: '#1e40af',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              padding: '12px 24px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            {checking ? 'Checking...' : 'Check'}
          </button>
        </div>

        {serviceAvailable === false && (
          <p style={{ color: '#fca5a5', marginTop: 8, fontSize: 14 }}>
            Service not available in your area yet. We'll notify you when we launch!
          </p>
        )}
        {serviceAvailable === true && (
          <p style={{ color: '#86efac', marginTop: 8, fontSize: 14 }}>
            Service available in your area!
          </p>
        )}
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Search for products or shops..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1,
              padding: '14px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              fontSize: 15,
            }}
          />
          <button type="submit" style={{
            background: '#2563eb',
            color: 'white',
            padding: '14px 24px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
          }}>
            Search
          </button>
        </div>
      </form>

      {/* Categories */}
      <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Shop by Category</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 32 }}>
        {categories.map(cat => (
          <Link
            key={cat.name}
            to={`/customer/vendors?category=${cat.name}`}
            style={{
              background: 'white',
              borderRadius: 12,
              padding: 20,
              textAlign: 'center',
              textDecoration: 'none',
              color: '#1e293b',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>{cat.icon}</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{cat.name}</div>
          </Link>
        ))}
      </div>

      {/* Nearby Vendors */}
      {serviceAvailable && (
        <>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Shops Near You</h2>
          {loadingVendors ? (
            <p>Loading shops...</p>
          ) : vendors.length === 0 ? (
            <p style={{ color: '#64748b' }}>No shops available in your area yet.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {vendors.map(vendor => (
                <Link
                  key={vendor.id}
                  to={`/customer/vendor/${vendor.id}`}
                  style={{
                    background: 'white',
                    borderRadius: 12,
                    padding: 16,
                    textDecoration: 'none',
                    color: '#1e293b',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  }}
                >
                  <div style={{ fontSize: 40, marginBottom: 8 }}>
                    {vendor.category === 'Medicine' ? '💊' :
                     vendor.category === 'Food' ? '🍔' :
                     vendor.category === 'Bakery' ? '🍞' : '🏪'}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{vendor.shop_name}</h3>
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>{vendor.category}</p>
                  <p style={{ fontSize: 13, color: '#64748b' }}>{vendor.pincode}</p>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Quick Actions for logged in users */}
      <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
        <Link to="/customer/login" style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          padding: '14px 24px',
          borderRadius: 8,
          textDecoration: 'none',
          color: '#2563eb',
          fontWeight: 600,
        }}>
          Login / Sign Up
        </Link>
        <Link to="/customer/orders" style={{
          background: 'white',
          border: '1px solid #e2e8f0',
          padding: '14px 24px',
          borderRadius: 8,
          textDecoration: 'none',
          color: '#2563eb',
          fontWeight: 600,
        }}>
          My Orders
        </Link>
      </div>
    </div>
  );
}
