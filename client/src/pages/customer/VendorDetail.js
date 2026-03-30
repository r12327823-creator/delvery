import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';

export default function CustomerVendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendor();
    const savedCart = JSON.parse(localStorage.getItem('m2h_cart') || '[]');
    setCart(savedCart.filter(item => item.vendor_id === id));
  }, [id]);

  const loadVendor = async () => {
    try {
      const result = await api.getVendor(id);
      setVendor(result.vendor);
      setProducts(result.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product) => {
    const savedCart = JSON.parse(localStorage.getItem('m2h_cart') || '[]');

    // Remove any items from other vendors
    const otherVendorItems = savedCart.filter(item => item.vendor_id !== id);
    const existingIndex = otherVendorItems.findIndex(item => item.product_id === product.id);

    let newCart;
    if (existingIndex >= 0) {
      otherVendorItems[existingIndex].quantity += 1;
      newCart = otherVendorItems;
    } else {
      newCart = [...otherVendorItems, {
        vendor_id: id,
        vendor_name: vendor?.shop_name,
        product_id: product.id,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        image: product.image,
      }];
    }

    localStorage.setItem('m2h_cart', JSON.stringify(newCart));
    setCart(newCart);
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
  };

  if (loading) return <div>Loading...</div>;
  if (!vendor) return <div>Vendor not found</div>;

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

      {/* Vendor Header */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: 24,
        marginBottom: 20,
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{vendor.shop_name}</h1>
        <p style={{ color: '#64748b', marginBottom: 4 }}>{vendor.category}</p>
        <p style={{ color: '#64748b', fontSize: 14 }}>{vendor.pincode}</p>
      </div>

      {/* Products */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Products</h2>
      {products.length === 0 ? (
        <p style={{ color: '#64748b' }}>No products available</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {products.map(product => {
            const cartItem = cart.find(c => c.product_id === product.id);
            const qty = cartItem?.quantity || 0;

            return (
              <div key={product.id} style={{
                background: 'white',
                borderRadius: 10,
                padding: 16,
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}>
                {product.image && (
                  <img
                    src={product.image}
                    alt={product.name}
                    style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }}
                  />
                )}
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{product.name}</h3>
                {product.description && (
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>{product.description}</p>
                )}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#2563eb' }}>₹{product.price}</span>

                  {qty === 0 ? (
                    <button
                      onClick={() => addToCart(product)}
                      style={{
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Add +
                    </button>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button onClick={() => updateQuantity(product.id, -1)} style={qtyBtn}>−</button>
                      <span style={{ fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{qty}</span>
                      <button onClick={() => updateQuantity(product.id, 1)} style={qtyBtn}>+</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart Bar */}
      {cart.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#2563eb',
          color: 'white',
          padding: '14px 28px',
          borderRadius: 50,
          boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 16,
          zIndex: 50,
        }}
          onClick={() => navigate('/customer/cart')}
        >
          View Cart ({cart.reduce((s, i) => s + i.quantity, 0)} items)
        </div>
      )}
    </div>
  );
}

const qtyBtn = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: 'none',
  background: '#e2e8f0',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
