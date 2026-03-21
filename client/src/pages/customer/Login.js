import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function CustomerLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1); // 1: mobile, 2: otp
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState(''); // For development

  const sendOTP = async () => {
    if (!mobile || mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.requestOTP(mobile);
      // In dev mode, OTP is returned in response
      if (result.otp) setDevOtp(result.otp);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (!otp || otp.length !== 4) {
      setError('Please enter the 4-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.verifyOTP({ mobile, otp, role: 'customer' });
      login(result.token, result.user);
      navigate('/customer');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '60px auto' }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#1e293b' }}>
          Welcome Back
        </h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
          Login with your mobile number
        </p>

        {step === 1 ? (
          <div>
            <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Mobile Number</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, marginBottom: 16 }}>
              <span style={{
                padding: '12px 14px',
                background: '#f1f5f9',
                borderRadius: 8,
                fontWeight: 600,
                color: '#475569',
              }}>+91</span>
              <input
                type="text"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="Enter mobile number"
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 16,
                }}
              />
            </div>
            <button
              onClick={sendOTP}
              disabled={loading}
              style={{
                width: '100%',
                background: '#2563eb',
                color: 'white',
                padding: '14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: '#64748b', marginBottom: 16 }}>
              OTP sent to <strong>+91 {mobile}</strong>
            </p>

            {devOtp && (
              <div style={{
                background: '#fef3c7',
                padding: 8,
                borderRadius: 6,
                fontSize: 13,
                marginBottom: 16,
                textAlign: 'center',
              }}>
                Dev Mode OTP: <strong>{devOtp}</strong>
              </div>
            )}

            <label style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Enter 4-digit OTP"
              maxLength={4}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                fontSize: 20,
                textAlign: 'center',
                letterSpacing: 8,
                marginTop: 8,
                marginBottom: 16,
              }}
            />
            <button
              onClick={verifyOTP}
              disabled={loading}
              style={{
                width: '100%',
                background: '#2563eb',
                color: 'white',
                padding: '14px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button
              onClick={() => { setStep(1); setOtp(''); }}
              style={{
                width: '100%',
                marginTop: 8,
                background: 'transparent',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Change mobile number
            </button>
          </div>
        )}

        {error && (
          <p style={{ color: '#ef4444', marginTop: 12, fontSize: 14 }}>{error}</p>
        )}
      </div>
    </div>
  );
}
