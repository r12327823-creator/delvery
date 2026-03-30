import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

export default function CustomerSearch() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  const [search, setSearch] = useState(query);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('m2h_cart') || '[]');
    setCart(savedCart);
  }, []);

  useEffect(() => {
    if (query) {
      searchProducts(query);
      setSearch(query);
    }
  }, [query]);

  const searchProducts = async (q) => {
    setLoading(true);
    try {
      const pincode = localStorage.getItem('m2h_pincode') || '';
      const result = await api.searchProducts(q, pincode);
      setProducts(result.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      setSearchParams({ q: search.trim() });
    }
  };

  const addToCart = (product) => {
    const savedCart = JSON.parse(localStorage.getItem('m2h_cart') || '[]');

    // Check if adding from a different vendor
    if (savedCart.length > 0 && savedCart[0].vendor_id !== product.vendor_id) {
      if (!window.confirm('Adding items from a different shop will clear your current cart. Continue?')) {
        return;
      }
      // Clear cart for new vendor
      savedCart.length = 0;
    }

    const existingIndex = savedCart.findIndex(item => item.product_id === product.id);

    if (existingIndex >= 0) {
      savedCart[existingIndex].quantity += 1;
    } else {
      savedCart.push({
        vendor_id: product.vendor_id,
        vendor_name: product.shop_name,
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        image: product.image,
      });
    }

    localStorage.setItem('m2h_cart', JSON.stringify(savedCart));
    setCart([...savedCart]);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateQuantity = (productId, delta) => {
    const savedCart = JSON.parse(localStorage.getItem('m2h_cart') || '[]');
    const newCart = savedCart.map(item => {
      if (item.product_id === productId) {
        return { ...item, quantity: Math.max(0, item.quantity + delta) };
      }
      return item;
    }).filter(item => item.quantity > 0);

    localStorage.setItem('m2h_cart', JSON.stringify(newCart));
    setCart(newCart);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const getCartQty = (productId) => {
    const item = cart.find(c => c.product_id === productId);
    return item?.quantity || 0;
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Group products by vendor
  const vendorGroups = {};
  products.forEach(product => {
    if (!vendorGroups[product.vendor_id]) {
      vendorGroups[product.vendor_id] = {
        vendor_id: product.vendor_id,
        shop_name: product.shop_name,
        vendor_category: product.vendor_category,
        products: [],
      };
    }
    vendorGroups[product.vendor_id].products.push(product);
  });

  return (
    <div style={{ paddingBottom: cartCount > 0 ? 80 : 20 }}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate('/customer')}
            style={{
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 12,
              padding: '0 14px',
              cursor: 'pointer',
              fontSize: 18,
              color: '#64748b',
            }}
          >
            ←
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>🔍</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for anything..."
              autoFocus
              style={{
                width: '100%',
                padding: '14px 14px 14px 42px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: 16,
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => e.target.style.borderColor = '#2563eb'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
          <button type="submit" style={{
            background: '#2563eb',
            color: 'white',
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 15,
          }}>
            Search
          </button>
        </div>
      </form>

      {/* Results Header */}
      {query && (
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
              Results for "{query}"
            </h1>
            <p style={{ fontSize: 14, color: '#64748b' }}>
              {products.length} item{products.length !== 1 ? 's' : ''} found from {Object.keys(vendorGroups).length} shop{Object.keys(vendorGroups).length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#64748b' }}>
          <div style={{ fontSize: 40, marginBottom: 12, animation: 'spin 1s linear infinite' }}>🔍</div>
          <p style={{ fontSize: 16 }}>Searching nearby shops...</p>
        </div>
      ) : products.length === 0 ? (
        /* No Results */
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
            No items found for "{query}"
          </h2>
          <p style={{ color: '#64748b', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
            Try searching with different words or check out our quick picks on the home page
          </p>
          <button
            onClick={() => navigate('/customer')}
            style={{
              background: '#2563eb',
              color: 'white',
              border: 'none',
              padding: '12px 28px',
              borderRadius: 10,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Browse Home
          </button>
        </div>
      ) : (
        /* Product Results - Grouped by Vendor */
        <div>
          {Object.values(vendorGroups).map(group => (
            <div key={group.vendor_id} style={{ marginBottom: 28 }}>
              {/* Vendor Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 12,
                padding: '10px 16px',
                background: '#f1f5f9',
                borderRadius: 10,
              }}>
                <span style={{ fontSize: 22 }}>🏪</span>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{group.shop_name}</h2>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{group.vendor_category}</span>
                </div>
                <span style={{ marginLeft: 'auto', fontSize: 13, color: '#64748b', fontWeight: 500 }}>
                  {group.products.length} item{group.products.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Products Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 12,
              }}>
                {group.products.map(product => {
                  const qty = getCartQty(product.id);
                  return (
                    <div key={product.id} style={{
                      background: 'white',
                      borderRadius: 14,
                      overflow: 'hidden',
                      boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                      transition: 'transform 0.15s, box-shadow 0.15s',
                    }}
                      onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
                      onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 1px 6px rgba(0,0,0,0.06)'; }}
                    >
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.name}
                          style={{ width: '100%', height: 140, objectFit: 'cover' }}
                        />
                      )}
                      <div style={{ padding: 14 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                          {product.name}
                        </h3>
                        {product.description && (
                          <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, lineHeight: 1.4 }}>
                            {product.description.length > 60 ? product.description.slice(0, 60) + '...' : product.description}
                          </p>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 17, fontWeight: 800, color: '#2563eb' }}>
                            ₹{product.price}
                          </span>

                          {qty === 0 ? (
                            <button
                              onClick={() => addToCart(product)}
                              style={{
                                background: '#2563eb',
                                color: 'white',
                                border: 'none',
                                padding: '8px 18px',
                                borderRadius: 8,
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 700,
                                transition: 'background 0.15s',
                              }}
                              onMouseOver={(e) => e.target.style.background = '#1d4ed8'}
                              onMouseOut={(e) => e.target.style.background = '#2563eb'}
                            >
                              Add +
                            </button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button
                                onClick={() => updateQuantity(product.id, -1)}
                                style={qtyBtnStyle}
                              >
                                −
                              </button>
                              <span style={{ fontWeight: 700, minWidth: 24, textAlign: 'center', fontSize: 15 }}>
                                {qty}
                              </span>
                              <button
                                onClick={() => updateQuantity(product.id, 1)}
                                style={{ ...qtyBtnStyle, background: '#2563eb', color: 'white' }}
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
          <span style={{
            background: 'rgba(255,255,255,0.25)',
            padding: '2px 10px',
            borderRadius: 20,
            fontSize: 14,
          }}>
            ₹{cartTotal}
          </span>
        </div>
      )}
    </div>
  );
}

const qtyBtnStyle = {
  width: 32,
  height: 32,
  borderRadius: 8,
  border: 'none',
  background: '#e2e8f0',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
