import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SellerLogin from './pages/auth/SellerLogin';
import SellerRegister from './pages/auth/SellerRegister';
import SellerForgotPassword from './pages/auth/SellerForgotPassword';
import SellerResetPassword from './pages/auth/SellerResetPassword';
import SellerDashboard from './pages/seller/Dashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';

// Component to protect routes
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userAuth, sellerAuth, loading } = useContext(AuthContext);

  // Wait for auth loading to complete
  if (loading) {
    return <div>Loading authentication...</div>; // Or a spinner
  }

  const isAuthenticatedUser = userAuth.isAuthenticated && allowedRoles.includes('user');
  const isAuthenticatedSeller = sellerAuth.isAuthenticated && allowedRoles.includes('seller');

  if (isAuthenticatedUser || isAuthenticatedSeller) {
    return children; // User is authenticated and has an allowed role
  }

  // Determine where to redirect based on what was attempted
  // If seller login failed or seller is trying to access protected route
  if (allowedRoles.includes('seller')) {
    return <Navigate to="/seller/login" replace />;
  }
  // If user login failed or user is trying to access protected route
  if (allowedRoles.includes('user')) {
     // You might have a separate user login path, adjusting based on your app structure
    return <Navigate to="/user/login" replace />;
  }

  // Default fallback (e.g., if no roles match or a general protected route)
  return <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 🟢 Redirect / to seller/login (or a landing page) */}
        <Route path="/" element={<Navigate to="/seller/login" />} />
        
        {/* Seller Authentication Routes */}
        <Route path="/seller/login" element={<SellerLogin />} />
        <Route path="/seller/register" element={<SellerRegister />} />
        <Route path="/seller/forgot-password" element={<SellerForgotPassword />} />
        <Route path="/seller/reset-password/:token" element={<SellerResetPassword />} />

        {/* Seller Protected Routes */}
        <Route 
          path="/seller/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />
        {/* Add other seller protected routes here */}

        {/* User Routes (assuming they exist elsewhere) */}
        {/* <Route path="/user/login" element={<UserLogin />} /> */}
        {/* <Route path="/user/dashboard" element={<ProtectedRoute allowedRoles={['user']}>...</ProtectedRoute>} /> */}

        {/* Default Fallback - Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/seller/login" />} />

      </Routes>

      {/* Toast Notifications */}
      <ToastContainer position="top-center" />
    </Router>
  );
}

export default App;
