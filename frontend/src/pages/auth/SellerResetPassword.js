import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { resetPassword, verifyResetToken } from '../../services/sellerService';
import './SellerResetPassword.css'; // ✅ new CSS

const ResetPasswordSchema = Yup.object().shape({
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  confirmPassword: Yup.string().oneOf([Yup.ref('password')], 'Passwords must match').required('Confirm password is required'),
});

const SellerResetPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const [tokenValidating, setTokenValidating] = useState(true);
  const [passwordReset, setPasswordReset] = useState(false);
  const { token } = useParams();

  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await verifyResetToken(token);
        setIsValidToken(response.success);
      } catch (error) {
        setIsValidToken(false);
        toast.error('Invalid or expired reset link');
      } finally {
        setTokenValidating(false);
      }
    };
    validateToken();
  }, [token]);

  if (tokenValidating) {
    return <div className="auth-container"><div className="auth-card"><p>Validating your reset link...</p></div></div>;
  }

  if (!isValidToken) {
    return (
      <div className="auth-container">
        <div className="auth-card text-center">
          <h2 className="auth-title">Invalid Reset Link</h2>
          <p className="auth-subtitle">This password reset link is invalid or expired.</p>
          <Link to="/seller/forgot-password" className="btn-primary mt-4">Request New Reset Link</Link>
        </div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="auth-container">
        <div className="auth-card text-center">
          <h2 className="auth-title">Password Reset Complete</h2>
          <p className="auth-subtitle">Your password has been reset successfully.</p>
          <Link to="/seller/login" className="btn-primary mt-4">Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <img src="https://zammernow.com/assets/logo.svg" alt="Zammer Logo" className="logo" />
        </div>
        <h2 className="auth-title">Reset Your Password</h2>
        <p className="auth-subtitle">Please enter your new password below.</p>
        <Formik
          initialValues={{ password: '', confirmPassword: '' }}
          validationSchema={ResetPasswordSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setIsLoading(true);
            try {
              const response = await resetPassword({ token, password: values.password });
              if (response.success) {
                setPasswordReset(true);
                toast.success('Password reset successfully!');
              } else {
                toast.error('Failed to reset password.');
              }
            } catch (error) {
              toast.error('Something went wrong.');
            } finally {
              setIsLoading(false);
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="auth-form">
              <Field className="input-field" name="password" type="password" placeholder="New Password" />
              <ErrorMessage name="password" component="div" className="error-text" />
              <Field className="input-field" name="confirmPassword" type="password" placeholder="Confirm New Password" />
              <ErrorMessage name="confirmPassword" component="div" className="error-text" />
              <button type="submit" disabled={isSubmitting || isLoading} className="btn-primary">
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default SellerResetPassword;
