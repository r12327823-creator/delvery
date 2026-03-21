import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const result = await api.getSettings();
      const settingsMap = {};
      result.settings?.forEach(s => { settingsMap[s.key_name] = s.value; });
      setSettings(settingsMap);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const saveSetting = async (key, value) => {
    setSaving(true);
    try {
      await api.updateSetting(key, value);
      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div>Loading...</div>;

  const settingFields = [
    { key: 'delivery_fee', label: 'Delivery Fee (₹)', desc: 'Fee charged to customer per delivery', type: 'number' },
    { key: 'rider_pay_per_delivery', label: 'Rider Pay per Delivery (₹)', desc: 'Amount rider earns per delivery', type: 'number' },
    { key: 'platform_commission', label: 'Platform Commission (%)', desc: 'Commission taken from vendors', type: 'number' },
    { key: 'order_timeout_minutes', label: 'Order Timeout (minutes)', desc: 'Time before order is flagged if no rider', type: 'number' },
    { key: 'vendor_order_timeout_minutes', label: 'Vendor Accept Timeout (minutes)', desc: 'Time before unaccepted order is auto-flagged', type: 'number' },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Platform Settings</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>Configure delivery fees, commissions, and platform parameters</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 16 }}>
        {settingFields.map(field => (
          <div key={field.key} style={{ background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{field.label}</h3>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>{field.desc}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={field.type}
                value={settings[field.key] || ''}
                onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                style={{ flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 16 }}
              />
              <button
                onClick={() => saveSetting(field.key, settings[field.key])}
                disabled={saving}
                style={{ background: '#7c3aed', color: 'white', padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}
              >
                Save
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32, background: '#ede9fe', borderRadius: 12, padding: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Revenue Calculation</h3>
        <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.8 }}>
          Customer pays ₹{settings.delivery_fee || 40} delivery fee<br />
          Rider earns ₹{settings.rider_pay_per_delivery || 30} per delivery<br />
          Platform keeps ₹{((settings.delivery_fee || 40) - (settings.rider_pay_per_delivery || 30))} per delivery<br />
          Vendor commission: {settings.platform_commission || 10}% per order
        </p>
      </div>
    </div>
  );
}
