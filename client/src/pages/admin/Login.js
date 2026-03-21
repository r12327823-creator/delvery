import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [credentials, setCredentials] = useState({ mobile: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Admin login with fixed credentials (for MVP)
    // In production, use proper JWT auth with OTP
    if (credentials.mobile === '9999999999') {
      const demoToken = 'admin_demo_token_' + Date.now();
      localStorage.setItem('m2h_token', demoToken);
      login(demoToken, { id: 'admin_001', mobile: '9999999999', name: 'Admin', role: 'admin', pincode: '110001' });
      navigate('/admin');
    } else {
      // Try OTP flow
      try {
        const result = await api.requestOTP(credentials.mobile);
        if (result.otp) {
          const otp = prompt(`Dev Mode OTP: ${result.otp}\n\nEnter OTP:`);
          if (otp === result.otp) {
            const verifyResult = await api.verifyOTP({ mobile: credentials.mobile, otp, role: 'admin' });
            login(verifyResult.token, verifyResult.user);
            navigate('/admin');
          }
        }
      } catch (err) {
        setError('Invalid credentials. Use mobile: 9999999999 for admin access.');
      }
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Admin Login</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Access the Market 2 Home control panel</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Mobile Number</label>
            <input
              type="text"
              value={credentials.mobile}
              onChange={e => setCredentials(c => ({ ...c, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
              placeholder="Admin mobile number"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 16, marginTop: 6 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 14, fontWeight: 600 }}>Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={e => setCredentials(c => ({ ...c, password: e.target.value }))}
              placeholder="Password"
              style={{ width: '100%', padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 16, marginTop: 6 }}
            />
          </div>

          <button type="submit" disabled={loading} style={{ width: '100%', background: '#7c3aed', color: 'white', padding: '14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div style={{ background: '#f3f4f6', padding: 12, borderRadius: 8, marginTop: 16, fontSize: 13, color: '#6b7280' }}>
          💡 Demo: Use mobile <strong>9999999999</strong> to login as admin
        </div>

        {error && <p style={{ color: '#ef4444', marginTop: 12, fontSize: 14 }}>{error}</p>}
      </div>
    </div>
  );
}
