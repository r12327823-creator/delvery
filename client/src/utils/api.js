// Uses env var in production (Vercel), relative path in dev
const API_BASE = (window.REACT_APP_API_URL || '') + '/api';

const getToken = () => localStorage.getItem('m2h_token');

const request = async (endpoint, options = {}) => {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
};

// Auth
export const api = {
  // Auth
  requestOTP: (mobile) => request('/auth/request-otp', { method: 'POST', body: JSON.stringify({ mobile }) }),
  verifyOTP: (data) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // Customer
  checkPincode: (pincode) => request(`/customer/check-pincode/${pincode}`),
  getVendors: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/customer/vendors${query ? '?' + query : ''}`);
  },
  getVendor: (id) => request(`/customer/vendors/${id}`),
  searchProducts: (q, pincode) => request(`/customer/search?q=${encodeURIComponent(q)}&pincode=${pincode}`),
  getPopularProducts: (pincode) => request(`/customer/popular${pincode ? '?pincode=' + pincode : ''}`),
  placeOrder: (data) => request('/customer/orders', { method: 'POST', body: JSON.stringify(data) }),
  getOrders: (status) => request(`/customer/orders${status ? '?status=' + status : ''}`),
  getOrder: (id) => request(`/customer/orders/${id}`),
  getRiderLocation: (id) => request(`/customer/orders/${id}/rider-location`),

  // Vendor
  getVendorProfile: () => request('/vendor/profile'),
  updateVendorProfile: (data) => request('/vendor/profile', { method: 'PUT', body: JSON.stringify(data) }),
  getVendorProducts: () => request('/vendor/products'),
  addProduct: (data) => request('/vendor/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/vendor/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/vendor/products/${id}`, { method: 'DELETE' }),
  getVendorOrders: (status) => request(`/vendor/orders${status ? '?status=' + status : ''}`),
  acceptOrder: (id) => request(`/vendor/orders/${id}/accept`, { method: 'POST' }),
  rejectOrder: (id, reason) => request(`/vendor/orders/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  readyOrder: (id) => request(`/vendor/orders/${id}/ready`, { method: 'POST' }),
  getVendorEarnings: () => request('/vendor/earnings'),

  // Rider
  getRiderProfile: () => request('/rider/profile'),
  submitKYC: (data) => request('/rider/kyc', { method: 'POST', body: JSON.stringify(data) }),
  toggleStatus: (is_online) => request('/rider/toggle-status', { method: 'POST', body: JSON.stringify({ is_online }) }),
  updateLocation: (lat, lng) => request('/rider/location', { method: 'POST', body: JSON.stringify({ lat, lng }) }),
  getOpenOrders: () => request('/rider/open-orders'),
  acceptOrder: (orderId) => request(`/rider/accept-order/${orderId}`, { method: 'POST' }),
  pickupOrder: (orderId) => request(`/rider/pickup/${orderId}`, { method: 'POST' }),
  deliverOrder: (orderId, cash_collected) => request(`/rider/deliver/${orderId}`, { method: 'POST', body: JSON.stringify({ cash_collected }) }),
  getRiderEarnings: () => request('/rider/earnings'),
  getCurrentOrder: () => request('/rider/current-order'),

  // Admin
  getDashboard: () => request('/admin/dashboard'),
  getPincodes: (is_active) => request(`/admin/pincodes${is_active !== undefined ? '?is_active=' + is_active : ''}`),
  addPincode: (data) => request('/admin/pincodes', { method: 'POST', body: JSON.stringify(data) }),
  updatePincode: (id, data) => request(`/admin/pincodes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAdminVendors: (status) => request(`/admin/vendors${status ? '?status=' + status : ''}`),
  updateVendor: (id, data) => request(`/admin/vendors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAdminRiders: (kyc_status) => request(`/admin/riders${kyc_status ? '?kyc_status=' + kyc_status : ''}`),
  updateRider: (id, data) => request(`/admin/riders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getAdminOrders: (status) => request(`/admin/orders${status ? '?status=' + status : ''}`),
  assignRider: (orderId, rider_id) => request(`/admin/orders/${orderId}/assign-rider`, { method: 'POST', body: JSON.stringify({ rider_id }) }),
  getSettings: () => request('/admin/settings'),
  updateSetting: (key, value) => request(`/admin/settings/${key}`, { method: 'PATCH', body: JSON.stringify({ value }) }),
  getPayouts: () => request('/admin/payouts'),
  createPayout: (data) => request('/admin/payouts', { method: 'POST', body: JSON.stringify(data) }),
};
