import React from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const portalConfig = {
  customer: {
    name: 'Market 2 Home',
    color: '#2563eb',
    nav: [
      { label: 'Home', path: '/customer' },
      { label: 'Vendors', path: '/customer/vendors' },
      { label: 'My Orders', path: '/customer/orders' },
    ],
    showCart: true,
  },
  vendor: {
    name: 'Vendor Portal',
    color: '#059669',
    nav: [
      { label: 'Dashboard', path: '/vendor' },
      { label: 'Products', path: '/vendor/products' },
      { label: 'Orders', path: '/vendor/orders' },
    ],
    showCart: false,
  },
  rider: {
    name: 'Rider Portal',
    color: '#d97706',
    nav: [
      { label: 'Dashboard', path: '/rider' },
      { label: 'Orders', path: '/rider/orders' },
      { label: 'Earnings', path: '/rider/earnings' },
    ],
    showCart: false,
  },
  admin: {
    name: 'Admin Panel',
    color: '#7c3aed',
    nav: [
      { label: 'Dashboard', path: '/admin' },
      { label: 'Pincodes', path: '/admin/pincodes' },
      { label: 'Vendors', path: '/admin/vendors' },
      { label: 'Riders', path: '/admin/riders' },
      { label: 'Orders', path: '/admin/orders' },
      { label: 'Payouts', path: '/admin/payouts' },
      { label: 'Settings', path: '/admin/settings' },
    ],
    showCart: false,
  },
};

export default function Layout({ portal }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const config = portalConfig[portal] || portalConfig.customer;
  const cart = JSON.parse(localStorage.getItem('m2h_cart') || '[]');
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        background: config.color,
        color: 'white',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: 1200,
          margin: '0 auto',
          height: 60,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link to={`/${portal}`} style={{ color: 'white', textDecoration: 'none', fontSize: 20, fontWeight: 700 }}>
              {config.name}
            </Link>
            <nav style={{ display: 'flex', gap: 8 }}>
              {config.nav.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.8)',
                    textDecoration: 'none',
                    padding: '6px 12px',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    background: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'transparent',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {config.showCart && (
              <Link to="/customer/cart" style={{ position: 'relative', color: 'white', textDecoration: 'none' }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 01-8 0"/>
                </svg>
                {cartCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -6,
                    right: -8,
                    background: '#ef4444',
                    color: 'white',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    fontSize: 11,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}>
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 14, opacity: 0.9 }}>{user.name}</span>
                <button
                  onClick={handleLogout}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
        <Outlet />
      </main>
    </div>
  );
}
