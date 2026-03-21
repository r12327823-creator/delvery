import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

export default function CustomerRegister() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    mobile: '',
    name: '',
    address: '',
    pincode: localStorage.getItem('m2h_pincode') || '',
  });
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const sendOTP = async () => {
    if (!formData.mobile || formData.mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const result = await api.requestOTP(formData.mobile);
      if (result.otp) setDevOtp(result.otp);
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    if (!formData.name || !formData.pincode) {
      setError('Name and pincode are required');
      return;
    }
    if (!otp || otp.length !== 4) {
      setError('Please enter the 4-digit OTP');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await api.verifyOTP({
        mobile: formData.mobile,
        otp,
        name: formData.name,
        role: 'customer',
        pincode: formData.pincode,
      });
      login(result.token, result.user);
      localStorage.setItem('m2h_pincode', formData.pincode);
      navigate('/customer');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: 32,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Create Account</h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>Join Market 2 Home</p>

        {step === 1 ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 600 }}>Full Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 600 }}>Mobile Number</label>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <span style={{ ...prefixStyle }}>+91</span>
                <input
                  name="mobile"
                  value={formData.mobile}
                  onChange={(e) => handleChange({ target: { name: 'mobile', value: e.target.value.replace(/\D/g, '').slice(0, 10) } })}
                  placeholder="Mobile number"
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 600 }}>Delivery Address</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Your complete address"
                rows={3}
                style={{ ...inputStyle, marginTop: 6, resize: 'vertical' }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 14, fontWeight: 600 }}>Pincode</label>
              <input
                name="pincode"
                value={formData.pincode}
                onChange={(e) => handleChange({ target: { name: 'pincode', value: e.target.value.replace(/\D/g, '').slice(0, 6) } })}
                placeholder="6-digit pincode"
                maxLength={6}
                style={{ ...inputStyle, marginTop: 6 }}
              />
            </div>
            <button onClick={sendOTP} disabled={loading} style={primaryBtn}>
              {loading ? 'Sending OTP...' : 'Continue'}
            </button>
          </div>
        ) : (
          <div>
            <p style={{ color: '#64748b', marginBottom: 8 }}>
              OTP sent to <strong>+91 {formData.mobile}</strong>
            </p>

            {devOtp && (
              <div style={{ ...devBanner }}>
                Dev Mode OTP: <strong>{devOtp}</strong>
              </div>
            )}

            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="Enter 4-digit OTP"
              maxLength={4}
              style={{ ...inputStyle, fontSize: 20, textAlign: 'center', letterSpacing: 8, margin: '16px 0' }}
            />
            <button onClick={register} disabled={loading} style={primaryBtn}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            <button onClick={() => setStep(1)} style={linkBtn}>
              Change details
            </button>
          </div>
        )}

        {error && <p style={{ color: '#ef4444', marginTop: 12 }}>{error}</p>}

        <p style={{ marginTop: 20, fontSize: 13, color: '#64748b', textAlign: 'center' }}>
          Already have an account? <a href="/customer/login" style={{ color: '#2563eb' }}>Login</a>
        </p>
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: '1px solid #e2e8f0',
  fontSize: 15,
};

const prefixStyle = {
  padding: '12px 14px',
  background: '#f1f5f9',
  borderRadius: 8,
  fontWeight: 600,
  color: '#475569',
};

const devBanner = {
  background: '#fef3c7',
  padding: 8,
  borderRadius: 6,
  fontSize: 13,
  marginBottom: 16,
  textAlign: 'center',
};

const primaryBtn = {
  width: '100%',
  background: '#2563eb',
  color: 'white',
  padding: '14px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontSize: 16,
  fontWeight: 600,
};

const linkBtn = {
  width: '100%',
  marginTop: 8,
  background: 'transparent',
  border: 'none',
  color: '#2563eb',
  cursor: 'pointer',
  fontSize: 14,
};
