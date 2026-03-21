import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../utils/api';

export default function CustomerVendors() {
  const [searchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') || '');

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const pincode = localStorage.getItem('m2h_pincode') || '';
      const category = searchParams.get('category') || '';
      const result = await api.getVendors({ pincode, category });
      setVendors(result.vendors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search.trim()) return loadVendors();
    setLoading(true);
    try {
      const pincode = localStorage.getItem('m2h_pincode') || '';
      const result = await api.searchProducts(search, pincode);
      // Group by vendor
      const vendorMap = {};
      result.products?.forEach(p => {
        if (!vendorMap[p.vendor_id]) {
          vendorMap[p.vendor_id] = { ...p, products: [] };
        }
        vendorMap[p.vendor_id].products.push(p);
      });
      setVendors(Object.values(vendorMap));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categoryColors = {
    Groceries: '#22c55e',
    Medicine: '#ef4444',
    Food: '#f97316',
    Bakery: '#eab308',
    Hardware: '#6b7280',
    Stationery: '#3b82f6',
  };

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Browse Shops</h1>

      <form onSubmit={handleSearch} style={{ marginBottom: 24 }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search shops or products..."
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: 15,
          }}
        />
      </form>

      {loading ? (
        <p>Loading shops...</p>
      ) : vendors.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <p>No shops found. Try a different search.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {vendors.map(vendor => (
            <Link
              key={vendor.id}
              to={`/customer/vendor/${vendor.id}`}
              style={{
                background: 'white',
                borderRadius: 12,
                padding: 20,
                textDecoration: 'none',
                color: '#1e293b',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                transition: 'transform 0.15s',
              }}
            >
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: `${categoryColors[vendor.category] || '#3b82f6'}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                marginBottom: 12,
              }}>
                {vendor.category === 'Medicine' ? '💊' :
                 vendor.category === 'Food' ? '🍔' :
                 vendor.category === 'Bakery' ? '🍞' :
                 vendor.category === 'Groceries' ? '🛒' :
                 vendor.category === 'Hardware' ? '🔧' : '🏪'}
              </div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 4 }}>{vendor.shop_name}</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                {vendor.category} • {vendor.pincode}
              </p>
              {vendor.owner_name && (
                <p style={{ fontSize: 13, color: '#64748b' }}>By {vendor.owner_name}</p>
              )}
              {vendor.products && (
                <p style={{ fontSize: 12, color: '#2563eb', marginTop: 8 }}>
                  {vendor.products.length} product(s) found
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
