import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SellerLogin from './pages/auth/SellerLogin';
import SellerRegister from './pages/auth/SellerRegister';
import SellerForgotPassword from './pages/auth/SellerForgotPassword';
import SellerResetPassword from './pages/auth/SellerResetPassword';
import SellerDashboard from './pages/seller/Dashboard';
import AddProduct from './pages/seller/AddProduct';
import ViewProducts from './pages/seller/ViewProducts';
import EditProduct from './pages/seller/EditProduct';
import EditProfile from './pages/seller/EditProfile';
import Orders from './pages/seller/Orders';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useContext } from 'react';
import { AuthContext } from './contexts/AuthContext';

// Component to protect routes
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { userAuth, sellerAuth, loading } = useContext(AuthContext);

  // Wait for auth loading to complete
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-white font-medium text-lg mt-6">Loading authentication...</p>
          <p className="text-purple-300 text-sm mt-2">Please wait while we verify your session</p>
        </div>
      </div>
    );
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
  return <Navigate to="/seller/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* 🟢 Default route - redirect to seller login */}
        <Route path="/" element={<Navigate to="/seller/login" replace />} />
        
        {/* Seller Authentication Routes (Public) */}
        <Route path="/seller/login" element={<SellerLogin />} />
        <Route path="/seller/register" element={<SellerRegister />} />
        <Route path="/seller/forgot-password" element={<SellerForgotPassword />} />
        <Route path="/seller/reset-password/:token" element={<SellerResetPassword />} />

        {/* Seller Dashboard Routes (Protected) */}
        <Route 
          path="/seller/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <SellerDashboard />
            </ProtectedRoute>
          }
        />

        {/* Product Management Routes (Protected) */}
        <Route 
          path="/seller/add-product" 
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <AddProduct />
            </ProtectedRoute>
          }
        />
        
        <Route 
          path="/seller/view-products" 
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <ViewProducts />
            </ProtectedRoute>
          }
        />
        
        <Route 
          path="/seller/edit-product/:id" 
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <EditProduct />
            </ProtectedRoute>
          }
        />

        {/* Order Management Routes (Protected) */}
        <Route 
          path="/seller/orders" 
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <Orders />
            </ProtectedRoute>
          }
        />

        {/* Profile Management Routes (Protected) */}
        <Route 
          path="/seller/edit-profile" 
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        {/* Seller Settings/Account Routes (Protected) */}
        <Route 
          path="/seller/settings" 
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <EditProfile />
            </ProtectedRoute>
          }
        />

        {/* Catch-all seller routes - redirect to dashboard if authenticated */}
        <Route 
          path="/seller/*" 
          element={
            <ProtectedRoute allowedRoles={['seller']}>
              <Navigate to="/seller/dashboard" replace />
            </ProtectedRoute>
          }
        />

        {/* Future User Routes (Placeholder - not implemented yet) */}
        {/* 
        <Route path="/user/login" element={<UserLogin />} />
        <Route path="/user/register" element={<UserRegister />} />
        <Route 
          path="/user/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserDashboard />
            </ProtectedRoute>
          }
        />
        */}

        {/* Default Fallback - Redirect unknown routes to seller login */}
        <Route path="*" element={<Navigate to="/seller/login" replace />} />
      </Routes>

      {/* Enhanced Toast Notifications */}
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          color: 'white'
        }}
      />
    </Router>
  );
}

export default App;