import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';

// Customer Pages
import CustomerHome from './pages/customer/Home';
import CustomerLogin from './pages/customer/Login';
import CustomerRegister from './pages/customer/Register';
import CustomerVendors from './pages/customer/Vendors';
import CustomerVendorDetail from './pages/customer/VendorDetail';
import CustomerSearch from './pages/customer/Search';
import CustomerCart from './pages/customer/Cart';
import CustomerOrders from './pages/customer/Orders';
import CustomerTrackOrder from './pages/customer/TrackOrder';

// Vendor Pages
import VendorDashboard from './pages/vendor/Dashboard';
import VendorLogin from './pages/vendor/Login';
import VendorProducts from './pages/vendor/Products';
import VendorOrders from './pages/vendor/Orders';

// Rider Pages
import RiderDashboard from './pages/rider/Dashboard';
import RiderLogin from './pages/rider/Login';
import RiderKYC from './pages/rider/KYC';
import RiderOrders from './pages/rider/Orders';
import RiderEarnings from './pages/rider/Earnings';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminLogin from './pages/admin/Login';
import AdminPincodes from './pages/admin/Pincodes';
import AdminVendors from './pages/admin/Vendors';
import AdminRiders from './pages/admin/Riders';
import AdminOrders from './pages/admin/Orders';
import AdminSettings from './pages/admin/Settings';
import AdminPayouts from './pages/admin/Payouts';

// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  if (!user) return <Navigate to="/" replace />;

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

// Public route (redirect if logged in)
const PublicRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>;

  if (user) return <Navigate to={`/${user.role}`} replace />;

  return children;
};

// Role-based redirect
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/customer" replace />;
  return <Navigate to={`/${user.role}`} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<RoleRedirect />} />

          {/* === CUSTOMER PORTAL === */}
          <Route path="/customer" element={<Layout portal="customer" />}>
            <Route index element={<CustomerHome />} />
            <Route path="login" element={<PublicRoute><CustomerLogin /></PublicRoute>} />
            <Route path="register" element={<PublicRoute><CustomerRegister /></PublicRoute>} />
            <Route path="search" element={<CustomerSearch />} />
            <Route path="vendors" element={<CustomerVendors />} />
            <Route path="vendor/:id" element={<CustomerVendorDetail />} />
            <Route path="cart" element={<CustomerCart />} />
            <Route path="orders" element={<ProtectedRoute allowedRoles={['customer']}><CustomerOrders /></ProtectedRoute>} />
            <Route path="track/:orderId" element={<ProtectedRoute allowedRoles={['customer']}><CustomerTrackOrder /></ProtectedRoute>} />
          </Route>

          {/* === VENDOR PORTAL === */}
          <Route path="/vendor" element={<Layout portal="vendor" />}>
            <Route index element={<ProtectedRoute allowedRoles={['vendor']}><VendorDashboard /></ProtectedRoute>} />
            <Route path="login" element={<PublicRoute><VendorLogin /></PublicRoute>} />
            <Route path="products" element={<ProtectedRoute allowedRoles={['vendor']}><VendorProducts /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute allowedRoles={['vendor']}><VendorOrders /></ProtectedRoute>} />
          </Route>

          {/* === RIDER PORTAL === */}
          <Route path="/rider" element={<Layout portal="rider" />}>
            <Route index element={<ProtectedRoute allowedRoles={['rider']}><RiderDashboard /></ProtectedRoute>} />
            <Route path="login" element={<PublicRoute><RiderLogin /></PublicRoute>} />
            <Route path="kyc" element={<ProtectedRoute allowedRoles={['rider']}><RiderKYC /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute allowedRoles={['rider']}><RiderOrders /></ProtectedRoute>} />
            <Route path="earnings" element={<ProtectedRoute allowedRoles={['rider']}><RiderEarnings /></ProtectedRoute>} />
          </Route>

          {/* === ADMIN PORTAL === */}
          <Route path="/admin" element={<Layout portal="admin" />}>
            <Route index element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="login" element={<PublicRoute><AdminLogin /></PublicRoute>} />
            <Route path="pincodes" element={<ProtectedRoute allowedRoles={['admin']}><AdminPincodes /></ProtectedRoute>} />
            <Route path="vendors" element={<ProtectedRoute allowedRoles={['admin']}><AdminVendors /></ProtectedRoute>} />
            <Route path="riders" element={<ProtectedRoute allowedRoles={['admin']}><AdminRiders /></ProtectedRoute>} />
            <Route path="orders" element={<ProtectedRoute allowedRoles={['admin']}><AdminOrders /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>} />
            <Route path="payouts" element={<ProtectedRoute allowedRoles={['admin']}><AdminPayouts /></ProtectedRoute>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
