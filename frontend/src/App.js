import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SellerLogin from './pages/auth/SellerLogin';
import SellerRegister from './pages/auth/SellerRegister';
import SellerForgotPassword from './pages/auth/SellerForgotPassword';
import SellerResetPassword from './pages/auth/SellerResetPassword';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* 🟢 Redirect / to seller/login */}
        <Route path="/" element={<Navigate to="/seller/login" />} />
        
        {/* Seller Authentication Routes */}
        <Route path="/seller/login" element={<SellerLogin />} />
        <Route path="/seller/register" element={<SellerRegister />} />
        <Route path="/seller/forgot-password" element={<SellerForgotPassword />} />
        <Route path="/seller/reset-password/:token" element={<SellerResetPassword />} />

        {/* Default Fallback */}
        <Route path="*" element={<Navigate to="/seller/login" />} />
      </Routes>

      {/* Toast Notifications */}
      <ToastContainer position="top-center" />
    </Router>
  );
}

export default App;
