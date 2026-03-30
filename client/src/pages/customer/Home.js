import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

const quickCategories = [
  { name: 'Ice Cream', emoji: '🍦', query: 'ice cream', color: '#fce4ec' },
  { name: 'Snacks', emoji: '🍿', query: 'snacks', color: '#fff3e0' },
  { name: 'Cold Drinks', emoji: '🥤', query: 'cold drink', color: '#e3f2fd' },
  { name: 'Fruits', emoji: '🍎', query: 'fruits', color: '#e8f5e9' },
  { name: 'Bread & Bakery', emoji: '🍞', query: 'bread', color: '#fff8e1' },
  { name: 'Milk & Dairy', emoji: '🥛', query: 'milk', color: '#f3e5f5' },
  { name: 'Medicine', emoji: '💊', query: 'medicine', color: '#fce4ec' },
  { name: 'Chocolates', emoji: '🍫', query: 'chocolate', color: '#efebe9' },
  { name: 'Biryani', emoji: '🍛', query: 'biryani', color: '#fff3e0' },
  { name: 'Pizza', emoji: '🍕', query: 'pizza', color: '#fbe9e7' },
  { name: 'Burger', emoji: '🍔', query: 'burger', color: '#fff8e1' },
  { name: 'Juice', emoji: '🧃', query: 'juice', color: '#e8f5e9' },
];

const moodSuggestions = [
  { mood: 'Feeling Hungry', emoji: '😋', query: 'food', color: '#ff6b35' },
  { mood: 'Sweet Tooth', emoji: '🍰', query: 'sweet', color: '#e91e63' },
  { mood: 'Party Time', emoji: '🎉', query: 'party snacks', color: '#9c27b0' },
  { mood: 'Feeling Lazy', emoji: '😴', query: 'ready to eat', color: '#3f51b5' },
  { mood: 'Health Mode', emoji: '🥗', query: 'healthy', color: '#4caf50' },
  { mood: 'Late Night', emoji: '🌙', query: 'midnight snack', color: '#1a237e' },
];

export default function CustomerHome() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [pincode, setPincode] = useState(localStorage.getItem('m2h_pincode') || '');
  const [pincodeSet, setPincodeSet] = useState(!!localStorage.getItem('m2h_pincode'));
  const [checking, setChecking] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState(null);
  const [popularProducts, setPopularProducts] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const cart = JSON.parse(localStorage.getItem('m2h_cart') || '[]');
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (pincodeSet && pincode) {
      loadPopularProducts();
    }
  }, [pincodeSet]);

  const loadPopularProducts = async () => {
    setLoadingPopular(true);
    try {
      const result = await api.getPopularProducts(pincode);
      setPopularProducts(result.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPopular(false);
    }
  };

  const checkPincode = async () => {
    if (!pincode || pincode.length !== 6) return;
    setChecking(true);
    try {
      const result = await api.checkPincode(pincode);
      setServiceAvailable(result.available);
      if (result.available) {
        localStorage.setItem('m2h_pincode', pincode);
        setPincodeSet(true);
      }
    } catch (err) {
      setServiceAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/customer/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  const handleQuickSearch = (query) => {
    navigate(`/customer/search?q=${encodeURIComponent(query)}`);
  };

  const addToCart = (product) => {
    const savedCart = JSON.parse(localStorage.getItem('m2h_cart') || '[]');
    const existingIndex = savedCart.findIndex(item => item.product_id === product.id);

    let newCart;
    if (existingIndex >= 0) {
      savedCart[existingIndex].quantity += 1;
      newCart = savedCart;
    } else {
      newCart = [...savedCart.filter(i => i.vendor_id === product.vendor_id), {
        vendor_id: product.vendor_id,
        vendor_name: product.shop_name,
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        image: product.image,
      }];
    }

    localStorage.setItem('m2h_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
    // force re-render
    navigate('/customer', { replace: true });
  };

  // Pincode entry screen
  if (!pincodeSet) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: '0 20px' }}>
          <div style={{ fontSize: 72, marginBottom: 16 }}>📍</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#1e293b', marginBottom: 8 }}>
            Where should we deliver?
          </h1>
          <p style={{ color: '#64748b', fontSize: 16, marginBottom: 32 }}>
            Enter your pincode to see what's available near you
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Enter 6-digit pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={(e) => e.key === 'Enter' && checkPincode()}
              style={{
                flex: 1,
                padding: '16px 20px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: 18,
                textAlign: 'center',
                letterSpacing: 4,
                fontWeight: 600,
                outline: 'none',
              }}
            />
            <button
              onClick={checkPincode}
              disabled={checking || pincode.length !== 6}
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '16px 32px',
                borderRadius: 12,
                cursor: pincode.length === 6 ? 'pointer' : 'not-allowed',
                fontWeight: 700,
                fontSize: 16,
                opacity: pincode.length === 6 ? 1 : 0.5,
              }}
            >
              {checking ? '...' : 'Go'}
            </button>
          </div>

          {serviceAvailable === false && (
            <p style={{ color: '#ef4444', marginTop: 16, fontSize: 15 }}>
              Sorry, we're not in your area yet. We'll be there soon!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: cartCount > 0 ? 80 : 20 }}>
      {/* Hero Search Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: 20,
        padding: '40px 28px 36px',
        color: 'white',
        marginBottom: 28,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: -40, right: -40, width: 200, height: 200,
          borderRadius: '50%', background: 'rgba(255,255,255,0.08)',
        }} />
        <div style={{
          position: 'absolute', bottom: -60, left: -30, width: 150, height: 150,
          borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
        }} />

        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, position: 'relative' }}>
          What are you craving? 🤤
        </h1>
        <p style={{ fontSize: 15, opacity: 0.9, marginBottom: 20, position: 'relative' }}>
          Type anything — we'll find it from shops near you
        </p>

        <form onSubmit={handleSearch} style={{ position: 'relative' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 20 }}>🔍</span>
              <input
                type="text"
                placeholder='Try "ice cream", "biryani", "cold coffee"...'
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  borderRadius: 14,
                  border: 'none',
                  fontSize: 16,
                  background: 'white',
                  color: '#1e293b',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <button type="submit" style={{
              background: '#1e293b',
              color: 'white',
              padding: '16px 28px',
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 15,
              whiteSpace: 'nowrap',
            }}>
              Search
            </button>
          </div>
        </form>

        {/* Pincode indicator */}
        <div style={{
          marginTop: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          position: 'relative',
        }}>
          <span style={{ fontSize: 13, opacity: 0.85 }}>📍 Delivering to {pincode}</span>
          <button
            onClick={() => { setPincodeSet(false); setServiceAvailable(null); }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              color: 'white',
              padding: '2px 10px',
              borderRadius: 20,
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Change
          </button>
        </div>
      </div>

      {/* Mood-Based Quick Actions */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>
        What's your mood?
      </h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))',
        gap: 10,
        marginBottom: 28,
      }}>
        {moodSuggestions.map(mood => (
          <button
            key={mood.mood}
            onClick={() => handleQuickSearch(mood.query)}
            style={{
              background: `linear-gradient(135deg, ${mood.color}dd, ${mood.color})`,
              border: 'none',
              borderRadius: 14,
              padding: '16px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              color: 'white',
              transition: 'transform 0.15s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: 28, marginBottom: 6 }}>{mood.emoji}</div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{mood.mood}</div>
          </button>
        ))}
      </div>

      {/* Quick Category Pills */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>
        Quick picks
      </h2>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 32,
      }}>
        {quickCategories.map(cat => (
          <button
            key={cat.name}
            onClick={() => handleQuickSearch(cat.query)}
            style={{
              background: cat.color,
              border: 'none',
              borderRadius: 50,
              padding: '10px 18px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 14,
              fontWeight: 600,
              color: '#1e293b',
              transition: 'transform 0.12s',
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Available Near You */}
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 14 }}>
        Available near you
      </h2>
      {loadingPopular ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          Loading items...
        </div>
      ) : popularProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🏪</div>
          <p>No products listed yet in your area. Try searching for what you want!</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
        }}>
          {popularProducts.slice(0, 12).map(product => (
            <div key={product.id} style={{
              background: 'white',
              borderRadius: 14,
              overflow: 'hidden',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'; }}
            >
              {product.image && (
                <img
                  src={product.image}
                  alt={product.name}
                  style={{ width: '100%', height: 130, objectFit: 'cover' }}
                />
              )}
              <div style={{ padding: 14 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                  {product.shop_name}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 17, fontWeight: 800, color: '#2563eb' }}>
                    ₹{product.price}
                  </span>
                  <button
                    onClick={() => addToCart(product)}
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      padding: '7px 16px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Add +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Cart Bar */}
      {cartCount > 0 && (
        <div
          onClick={() => navigate('/customer/cart')}
          style={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: 'white',
            padding: '16px 32px',
            borderRadius: 50,
            boxShadow: '0 6px 24px rgba(37,99,235,0.45)',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 16,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span>🛒</span>
          <span>View Cart ({cartCount} items)</span>
          <span style={{ background: 'rgba(255,255,255,0.25)', padding: '2px 10px', borderRadius: 20, fontSize: 14 }}>
            ₹{cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
          </span>
        </div>
      )}
    </div>
  );
}
