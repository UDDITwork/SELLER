import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import './SellerForgotPassword.css'; // ✅ new CSS

const SellerForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);

  const checkEmail = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/sellers/check-email', { email });
      if (response.data.success) {
        setEmailVerified(true);
        toast.success('Email verified. Please enter your new password.');
      } else {
        toast.error('Email not found');
      }
    } catch (error) {
      toast.error('Email not found or server error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPassword = async () => {
    if (!password || password.length < 6 || password !== confirmPassword) {
      toast.error('Password must be at least 6 characters and match confirmation.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await api.post('/sellers/reset-password-direct', { email, password });
      if (response.data.success) {
        setResetComplete(true);
        toast.success('Password reset successful!');
      } else {
        toast.error('Failed to reset password');
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <img src="https://zammernow.com/assets/logo.svg" alt="Zammer Logo" className="logo" />
        </div>
        {resetComplete ? (
          <div className="text-center">
            <h2 className="auth-title">Password Reset Complete</h2>
            <p className="auth-subtitle">Your password has been reset successfully.</p>
            <Link to="/seller/login" className="btn-primary mt-4">Sign In</Link>
          </div>
        ) : (
          <>
            <h2 className="auth-title">Reset Your Password</h2>
            <p className="auth-subtitle">
              {emailVerified ? 'Enter your new password below.' : 'Enter your email to reset your password.'}
            </p>
            <div className="auth-form">
              {!emailVerified ? (
                <>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    className="input-field"
                  />
                  <button onClick={checkEmail} disabled={isLoading} className="btn-primary">
                    {isLoading ? 'Checking...' : 'Continue'}
                  </button>
                </>
              ) : (
                <>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
                    className="input-field"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm New Password"
                    className="input-field"
                  />
                  <button onClick={resetPassword} disabled={isLoading} className="btn-primary">
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </>
              )}
            </div>
            <p className="text-center mt-4 text-sm text-gray-600">
              Remembered your password? <Link to="/seller/login" className="register-link">Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SellerForgotPassword;
