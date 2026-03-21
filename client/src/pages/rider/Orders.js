import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RiderOrders() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>Orders</h1>
      <div style={{ textAlign: 'center', padding: 40, background: 'white', borderRadius: 12 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚴</div>
        <p style={{ color: '#64748b' }}>All orders are managed from the Dashboard. Accept and manage deliveries there.</p>
        <button onClick={() => navigate('/rider')} style={{ marginTop: 16, background: '#d97706', color: 'white', padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700 }}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
