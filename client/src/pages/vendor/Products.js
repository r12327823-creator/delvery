import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function VendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', image: '' });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try {
      const result = await api.getVendorProducts();
      setProducts(result.products || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    try {
      if (editingId) {
        await api.updateProduct(editingId, form);
      } else {
        await api.addProduct(form);
      }
      setForm({ name: '', description: '', price: '', category: '', image: '' });
      setShowForm(false);
      setEditingId(null);
      loadProducts();
    } catch (err) { alert(err.message); }
  };

  const handleEdit = (product) => {
    setForm({ name: product.name, description: product.description || '', price: product.price, category: product.category || '', image: product.image || '' });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try { await api.deleteProduct(id); loadProducts(); } catch (err) { alert(err.message); }
  };

  const toggleStock = async (product) => {
    const newStatus = product.stock_status === 'in_stock' ? 'out_of_stock' : 'in_stock';
    try { await api.updateProduct(product.id, { stock_status: newStatus }); loadProducts(); } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Products</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', description: '', price: '', category: '', image: '' }); }}
          style={{ background: '#059669', color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}
        >
          + Add Product
        </button>
      </div>

      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <input placeholder="Product Name *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} style={inputStyle} required />
            <input placeholder="Price (₹) *" type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} style={inputStyle} required />
            <input placeholder="Category (e.g. Groceries)" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={{ ...inputStyle, gridColumn: '1' }} />
            <input placeholder="Image URL" value={form.image} onChange={e => setForm(p => ({ ...p, image: e.target.value }))} style={{ ...inputStyle, gridColumn: '1 / -1' }} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ ...inputStyle, gridColumn: '1 / -1', resize: 'vertical' }} />
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
              <button type="submit" style={{ ...btnStyle, background: '#059669' }}>{editingId ? 'Update' : 'Add'} Product</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ ...btnStyle, background: '#e2e8f0', color: '#374151' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? <p>Loading...</p> : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
          <p style={{ color: '#64748b' }}>No products yet. Add your first product to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {products.map(product => (
            <div key={product.id} style={{ background: 'white', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {product.image && <img src={product.image} alt={product.name} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8 }} />}
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: 15, fontWeight: 600 }}>{product.name}</h3>
                <p style={{ fontSize: 13, color: '#64748b' }}>{product.category || 'Uncategorized'}</p>
                <p style={{ fontSize: 12, color: product.stock_status === 'out_of_stock' ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                  {product.stock_status === 'out_of_stock' ? 'Out of Stock' : 'In Stock'}
                </p>
              </div>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#059669' }}>₹{product.price}</span>
              <button onClick={() => toggleStock(product)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 12 }}>
                Toggle Stock
              </button>
              <button onClick={() => handleEdit(product)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #3b82f6', background: 'white', color: '#3b82f6', cursor: 'pointer', fontSize: 12 }}>Edit</button>
              <button onClick={() => handleDelete(product.id)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #ef4444', background: 'white', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>Delete</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle = { padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 };
const btnStyle = { color: 'white', padding: '10px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 };
