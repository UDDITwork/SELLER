import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from "axios";
import { resetPassword, verifyResetToken } from '../../services/sellerService';

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

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
    },
    card: {
      background: 'rgba(255, 255, 255, 0.25)',
      backdropFilter: 'blur(20px)',
      borderRadius: '20px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      padding: '40px',
      width: '100%',
      maxWidth: '480px',
      boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.3s ease'
    },
    logoContainer: {
      textAlign: 'center',
      marginBottom: '30px'
    },
    logo: {
      height: '60px',
      filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
    },
    title: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#ffffff',
      textAlign: 'center',
      marginBottom: '12px',
      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    subtitle: {
      fontSize: '16px',
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
      marginBottom: '30px',
      lineHeight: '1.6'
    },
    form: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    },
    inputField: {
      width: '100%',
      padding: '16px 20px',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      background: 'rgba(255, 255, 255, 0.2)',
      backdropFilter: 'blur(10px)',
      fontSize: '16px',
      color: '#ffffff',
      outline: 'none',
      transition: 'all 0.3s ease',
      boxSizing: 'border-box'
    },
    button: {
      width: '100%',
      padding: '16px',
      borderRadius: '12px',
      border: 'none',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      color: '#ffffff',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)',
      marginTop: '10px'
    },
    buttonDisabled: {
      opacity: 0.6,
      cursor: 'not-allowed'
    },
    errorText: {
      color: '#ff6b6b',
      fontSize: '14px',
      marginTop: '4px',
      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
    },
    successContainer: {
      textAlign: 'center',
      padding: '20px'
    },
    successButton: {
      marginTop: '20px',
      display: 'inline-block',
      padding: '12px 30px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
      color: '#ffffff',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 25px rgba(72, 187, 120, 0.3)'
    },
    invalidContainer: {
      textAlign: 'center',
      padding: '20px'
    },
    invalidButton: {
      marginTop: '20px',
      display: 'inline-block',
      padding: '12px 30px',
      borderRadius: '12px',
      background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      color: '#ffffff',
      textDecoration: 'none',
      fontWeight: '600',
      transition: 'all 0.3s ease',
      boxShadow: '0 8px 25px rgba(255, 107, 107, 0.3)'
    },
    loadingContainer: {
      textAlign: 'center',
      padding: '40px',
      color: 'rgba(255, 255, 255, 0.9)',
      fontSize: '16px'
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid #ffffff',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      display: 'inline-block',
      marginRight: '8px'
    }
  };

  if (tokenValidating) {
    return (
      <div style={styles.container}>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
        <div style={styles.card}>
          <div style={styles.loadingContainer}>
            <span style={styles.spinner}></span>
            Validating your reset link...
          </div>
        </div>
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <img src="https://zammernow.com/assets/logo.svg" alt="Zammer Logo" style={styles.logo} />
          </div>
          
          <div style={styles.invalidContainer}>
            <h2 style={styles.title}>Invalid Reset Link</h2>
            <p style={styles.subtitle}>This password reset link is invalid or expired.</p>
            <Link 
              to="/seller/forgot-password" 
              style={styles.invalidButton}
              className="invalid-button"
            >
              Request New Reset Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.logoContainer}>
            <img src="https://zammernow.com/assets/logo.svg" alt="Zammer Logo" style={styles.logo} />
          </div>
          
          <div style={styles.successContainer}>
            <h2 style={styles.title}>Password Reset Complete</h2>
            <p style={styles.subtitle}>Your password has been reset successfully.</p>
            <Link 
              to="/seller/login" 
              style={styles.successButton}
              className="success-button"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .reset-input:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 255, 255, 0.15);
            border-color: rgba(255, 255, 255, 0.5);
          }
          
          .reset-input:focus {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 255, 255, 0.2);
            border-color: rgba(255, 255, 255, 0.6);
          }
          
          .reset-input::placeholder {
            color: rgba(255, 255, 255, 0.7);
          }
          
          .reset-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(255, 107, 107, 0.4);
          }
          
          .reset-button:active:not(:disabled) {
            transform: translateY(0);
          }
          
          .success-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(72, 187, 120, 0.4);
          }
          
          .invalid-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 35px rgba(255, 107, 107, 0.4);
          }
          
          @media (max-width: 768px) {
            .reset-card {
              padding: 30px 20px !important;
              margin: 10px;
            }
            
            .reset-title {
              font-size: 24px !important;
            }
            
            .reset-subtitle {
              font-size: 14px !important;
            }
          }
        `}
      </style>
      
      <div style={styles.card} className="reset-card">
        <div style={styles.logoContainer}>
          <img src="https://zammernow.com/assets/logo.svg" alt="Zammer Logo" style={styles.logo} />
        </div>
        
        <h2 style={styles.title} className="reset-title">Reset Your Password</h2>
        <p style={styles.subtitle} className="reset-subtitle">Please enter your new password below.</p>
        
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
            <Form style={styles.form}>
              <div>
                <Field 
                  style={styles.inputField}
                  className="reset-input"
                  name="password" 
                  type="password" 
                  placeholder="New Password" 
                />
                <ErrorMessage name="password" component="div" style={styles.errorText} />
              </div>
              
              <div>
                <Field 
                  style={styles.inputField}
                  className="reset-input"
                  name="confirmPassword" 
                  type="password" 
                  placeholder="Confirm New Password" 
                />
                <ErrorMessage name="confirmPassword" component="div" style={styles.errorText} />
              </div>
              
              <button 
                type="submit" 
                disabled={isSubmitting || isLoading} 
                style={{
                  ...styles.button,
                  ...((isSubmitting || isLoading) ? styles.buttonDisabled : {})
                }}
                className="reset-button"
              >
                {isLoading && <span style={styles.spinner}></span>}
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