import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api';

export default function RiderKYC() {
  const [rider, setRider] = useState(null);
  const [aadhaarFront, setAadhaarFront] = useState('');
  const [aadhaarBack, setAadhaarBack] = useState('');
  const [selfie, setSelfie] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      const result = await api.getRiderProfile();
      setRider(result.rider);
      setAadhaarFront(result.rider.aadhaar_front || '');
      setAadhaarBack(result.rider.aadhaar_back || '');
      setSelfie(result.rider.selfie || '');
      setSubmitted(result.rider.kyc_status === 'pending');
    } catch (err) { console.error(err); }
  };

  const submitKYC = async (e) => {
    e.preventDefault();
    if (!aadhaarFront || !aadhaarBack || !selfie) {
      alert('Please upload all three documents');
      return;
    }
    setLoading(true);
    try {
      await api.submitKYC({ aadhaar_front: aadhaarFront, aadhaar_back: aadhaarBack, selfie });
      setSubmitted(true);
      alert('KYC submitted! Admin will review within 24-48 hours.');
    } catch (err) { alert(err.message); }
    finally { setLoading(false); }
  };

  if (rider?.kyc_status === 'approved') {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>KYC Approved!</h2>
        <p style={{ color: '#64748b' }}>Your documents have been verified. You can start accepting orders.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Submit KYC Documents</h1>
      <p style={{ color: '#64748b', marginBottom: 24 }}>We need your Aadhaar and photo for verification. This keeps our platform safe.</p>

      {submitted && (
        <div style={{ background: '#fef3c7', padding: 16, borderRadius: 12, marginBottom: 20, color: '#92400e' }}>
          ✅ KYC documents submitted! Waiting for admin verification (24-48 hours).
        </div>
      )}

      <div style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
          📝 For MVP, paste document image URLs below. In production, integrate with file upload.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Aadhaar Card - Front *</label>
          <input type="text" value={aadhaarFront} onChange={e => setAadhaarFront(e.target.value)} placeholder="Paste Aadhaar front image URL" style={{ ...inputStyle, marginTop: 6 }} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Aadhaar Card - Back *</label>
          <input type="text" value={aadhaarBack} onChange={e => setAadhaarBack(e.target.value)} placeholder="Paste Aadhaar back image URL" style={{ ...inputStyle, marginTop: 6 }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Selfie Photo *</label>
          <input type="text" value={selfie} onChange={e => setSelfie(e.target.value)} placeholder="Paste selfie image URL" style={{ ...inputStyle, marginTop: 6 }} />
        </div>

        <button onClick={submitKYC} disabled={loading} style={{ width: '100%', background: '#d97706', color: 'white', padding: '14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>
          {loading ? 'Submitting...' : 'Submit KYC'}
        </button>

        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
          Your documents are only used for identity verification and are not shared.
        </p>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 };
