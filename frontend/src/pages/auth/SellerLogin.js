import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { loginSeller } from '../../services/sellerService';
import { AuthContext } from '../../contexts/AuthContext';
import './SellerLogin.css';  // New CSS file

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

const SellerLogin = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginSeller: authLoginSeller } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsLoading(true);
    try {
      const response = await loginSeller(values);
      if (response.success) {
        authLoginSeller(response.data);
        toast.success('Login successful!');
        navigate('/seller/dashboard');
      } else {
        toast.error(response.message || 'Login failed');
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2 className="login-title">Welcome Back Seller!</h2>
        <p className="login-subtitle">Login to manage your shop</p>

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="login-form">
              <div className="input-group">
                <Field
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  className="input-field"
                />
                <ErrorMessage name="email" component="div" className="error-message" />
              </div>
              <div className="input-group">
                <Field
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  className="input-field"
                />
                <ErrorMessage name="password" component="div" className="error-message" />
              </div>

              <div className="forgot-link">
                <Link to="/seller/forgot-password">Forgot Password?</Link>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="btn-primary"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="register-text">
                Don't have an account?{' '}
                <Link to="/seller/register" className="register-link">
                  Register
                </Link>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default SellerLogin;
