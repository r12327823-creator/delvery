import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function VendorLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [shopName, setShopName] = useState('');
  const [pincode, setPincode] = useState(localStorage.getItem('m2h_pincode') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const sendOTP = async () => {
    if (!mobile || mobile.length !== 10) { setError('Valid mobile number required'); return; }
    setLoading(true);
    try {
      const result = await api.requestOTP(mobile);
      if (result.otp) setDevOtp(result.otp);
      setStep(2);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 4) { setError('Enter 4-digit OTP'); return; }
    setLoading(true);
    setError('');
    try {
      // Try login first
      const loginResult = await api.verifyOTP({ mobile, otp, role: 'vendor' });
      login(loginResult.token, loginResult.user);
      navigate('/vendor');
    } catch (err) {
      if (err.message.includes('not found') || err.message.includes('not approved')) {
        setError(err.message);
      } else {
        // New registration needed
        setError('Account not found. Please contact admin to register your shop.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto' }}>
      <div style={{ background: 'white', borderRadius: 16, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Vendor Login</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Access your shop dashboard</p>

        <label style={{ fontSize: 14, fontWeight: 600 }}>Mobile Number</label>
        <div style={{ display: 'flex', gap: 8, marginTop: 6, marginBottom: 16 }}>
          <span style={{ padding: '12px 14px', background: '#f1f5f9', borderRadius: 8, fontWeight: 600, color: '#475569' }}>+91</span>
          <input
            type="text"
            value={mobile}
            onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="Shop mobile number"
            style={{ flex: 1, padding: '12px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 16 }}
          />
        </div>

        {step === 2 && (
          <div>
            {devOtp && <div style={{ background: '#fef3c7', padding: 8, borderRadius: 6, fontSize: 13, marginBottom: 12, textAlign: 'center' }}>Dev OTP: <strong>{devOtp}</strong></div>}
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Enter OTP"
              maxLength={4}
              style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 18, textAlign: 'center', letterSpacing: 6, marginBottom: 12 }}
            />
          </div>
        )}

        <button onClick={step === 1 ? sendOTP : verifyOTP} disabled={loading} style={{ width: '100%', background: '#059669', color: 'white', padding: '14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 600 }}>
          {loading ? 'Please wait...' : step === 1 ? 'Send OTP' : 'Login'}
        </button>

        {error && <p style={{ color: '#ef4444', marginTop: 12, fontSize: 14 }}>{error}</p>}

        <p style={{ marginTop: 20, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
          Want to register your shop? <a href="/vendor/register" style={{ color: '#059669' }}>Contact Admin</a>
        </p>
      </div>
    </div>
  );
}
