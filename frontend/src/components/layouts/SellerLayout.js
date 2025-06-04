import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const SellerLayout = ({ children }) => {
  const { sellerAuth, logoutSeller } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Debug logging for development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('SellerLayout - Current location:', location.pathname);
      console.log('SellerLayout - Auth state:', {
        isAuthenticated: sellerAuth?.isAuthenticated,
        hasSellerData: !!sellerAuth?.seller,
        sellerFirstName: sellerAuth?.seller?.firstName
      });
    }
  }, [location.pathname, sellerAuth]);

  // Handle authentication check
  useEffect(() => {
    const checkAuth = () => {
      try {
        // If not authenticated, redirect to login
        if (!sellerAuth?.isAuthenticated) {
          console.log('SellerLayout - Not authenticated, redirecting to login');
          navigate('/seller/login', { 
            replace: true,
            state: { from: location.pathname } 
          });
          return;
        }

        // Check if seller data is available
        if (!sellerAuth.seller) {
          console.warn('SellerLayout - Authenticated but no seller data');
          setError('Session data incomplete. Please log in again.');
          return;
        }

        setError(null);
      } catch (err) {
        console.error('SellerLayout - Auth check error:', err);
        setError('Authentication error occurred');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [sellerAuth, navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      console.log('SellerLayout - Logging out seller');
      logoutSeller();
      toast.success('Logged out successfully');
      navigate('/seller/login', { replace: true });
    } catch (error) {
      console.error('SellerLayout - Logout error:', error);
      toast.error('Error during logout');
    }
  };

  // Navigation items configuration
  const navigationItems = [
    {
      path: '/seller/dashboard',
      label: 'Dashboard',
      icon: (
        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      path: '/seller/orders',
      label: 'Orders',
      icon: (
        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      badge: true
    },
    {
      path: '/seller/add-product',
      label: 'Add Product',
      icon: (
        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      )
    },
    {
      path: '/seller/view-products',
      label: 'View Products',
      icon: (
        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    {
      path: '/seller/edit-profile',
      label: 'My Account',
      icon: (
        <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  // CSS Styles
  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb'
    },
    header: {
      backgroundColor: '#f97316',
      color: 'white',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    },
    headerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    headerLeft: {
      display: 'flex',
      alignItems: 'center'
    },
    headerTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      margin: 0
    },
    devBadge: {
      marginLeft: '8px',
      fontSize: '10px',
      backgroundColor: '#fb923c',
      padding: '4px 8px',
      borderRadius: '4px'
    },
    headerRight: {
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    },
    userInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    avatar: {
      backgroundColor: '#fb923c',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    userName: {
      display: 'none',
      '@media (min-width: 640px)': {
        display: 'inline'
      }
    },
    logoutBtn: {
      backgroundColor: 'white',
      color: '#f97316',
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'background-color 0.2s'
    },
    mainContainer: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px 16px',
      display: 'flex',
      gap: '24px',
      flexDirection: 'column'
    },
    sidebar: {
      width: '256px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '16px'
    },
    navList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '4px'
    },
    navItem: {
      margin: 0
    },
    navLink: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      textDecoration: 'none',
      transition: 'all 0.2s'
    },
    navLinkActive: {
      backgroundColor: '#f97316',
      color: 'white'
    },
    navLinkInactive: {
      color: '#374151',
      '&:hover': {
        backgroundColor: '#f9fafb',
        color: '#111827'
      }
    },
    navLinkContent: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    badge: {
      padding: '2px 8px',
      fontSize: '10px',
      backgroundColor: '#ef4444',
      color: 'white',
      borderRadius: '20px',
      animation: 'pulse 2s infinite'
    },
    shopInfo: {
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: '1px solid #e5e7eb'
    },
    shopInfoTitle: {
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
    },
    shopInfoContent: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      fontSize: '12px',
      color: '#6b7280'
    },
    shopInfoItem: {
      margin: 0
    },
    shopInfoLabel: {
      fontWeight: '500'
    },
    realtimeStatus: {
      paddingTop: '8px',
      borderTop: '1px solid #f3f4f6',
      marginTop: '8px'
    },
    realtimeIndicator: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    realtimeDot: {
      width: '8px',
      height: '8px',
      backgroundColor: '#10b981',
      borderRadius: '50%',
      animation: 'pulse 2s infinite'
    },
    realtimeText: {
      fontSize: '10px',
      color: '#059669'
    },
    mainContent: {
      flex: 1,
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      minHeight: 'calc(100vh - 12rem)'
    },
    footer: {
      backgroundColor: 'white',
      borderTop: '1px solid #e5e7eb',
      padding: '16px 0',
      marginTop: '32px'
    },
    footerContent: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '0 16px',
      textAlign: 'center',
      color: '#6b7280',
      fontSize: '14px'
    },
    devInfo: {
      marginTop: '4px',
      fontSize: '10px',
      color: '#9ca3af'
    },
    loadingContainer: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    loadingContent: {
      textAlign: 'center'
    },
    spinner: {
      width: '48px',
      height: '48px',
      border: '3px solid #f3f4f6',
      borderTop: '3px solid #f97316',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 16px'
    },
    errorContainer: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    errorCard: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
      padding: '24px',
      maxWidth: '400px',
      width: '100%',
      textAlign: 'center'
    },
    errorIcon: {
      backgroundColor: '#fee2e2',
      borderRadius: '50%',
      padding: '12px',
      width: '64px',
      height: '64px',
      margin: '0 auto 16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    errorTitle: {
      fontSize: '20px',
      fontWeight: 'bold',
      color: '#111827',
      marginBottom: '8px'
    },
    errorMessage: {
      color: '#6b7280',
      marginBottom: '16px'
    },
    errorButton: {
      backgroundColor: '#ea580c',
      color: 'white',
      padding: '8px 16px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      transition: 'background-color 0.2s'
    }
  };

  // Loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingContent}>
          <div style={styles.spinner}></div>
          <p style={{ color: '#6b7280' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorCard}>
          <div style={styles.errorIcon}>
            <svg style={{ width: '32px', height: '32px', color: '#dc2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 style={styles.errorTitle}>Authentication Error</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button
            onClick={() => navigate('/seller/login')}
            style={styles.errorButton}
            onMouseOver={(e) => e.target.style.backgroundColor = '#c2410c'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#ea580c'}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // If not authenticated, return null (redirect will happen)
  if (!sellerAuth?.isAuthenticated) {
    return null;
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.headerLeft}>
            <h1 style={styles.headerTitle}>Zammer Seller Dashboard</h1>
            {process.env.NODE_ENV === 'development' && (
              <span style={styles.devBadge}>DEV</span>
            )}
          </div>
          <div style={styles.headerRight}>
            {sellerAuth.seller && (
              <div style={styles.userInfo}>
                <div style={styles.avatar}>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>
                    {sellerAuth.seller.firstName?.charAt(0)?.toUpperCase() || 'S'}
                  </span>
                </div>
                <span style={{ display: window.innerWidth >= 640 ? 'inline' : 'none' }}>
                  {sellerAuth.seller.firstName || 'Seller'}
                </span>
              </div>
            )}
            <button 
              onClick={handleLogout}
              style={styles.logoutBtn}
              onMouseOver={(e) => e.target.style.backgroundColor = '#f9fafb'}
              onMouseOut={(e) => e.target.style.backgroundColor = 'white'}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div style={styles.mainContainer}>
        <div style={{ display: 'flex', gap: '24px', flexDirection: window.innerWidth >= 1024 ? 'row' : 'column' }}>
          {/* Sidebar Navigation */}
          <aside style={styles.sidebar}>
            <nav>
              <ul style={styles.navList}>
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path} style={styles.navItem}>
                      <Link 
                        to={item.path} 
                        style={{
                          ...styles.navLink,
                          ...(isActive ? styles.navLinkActive : styles.navLinkInactive)
                        }}
                        onClick={() => {
                          if (process.env.NODE_ENV === 'development') {
                            console.log(`Navigation clicked: ${item.path}`);
                          }
                        }}
                      >
                        <div style={styles.navLinkContent}>
                          {item.icon}
                          <span>{item.label}</span>
                        </div>
                        
                        {item.badge && item.path === '/seller/orders' && (
                          <span style={styles.badge}>
                            New
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Shop Info Widget */}
            <div style={styles.shopInfo}>
              <h3 style={styles.shopInfoTitle}>Shop Info</h3>
              <div style={styles.shopInfoContent}>
                <p style={styles.shopInfoItem}>
                  <span style={styles.shopInfoLabel}>Name:</span> {sellerAuth.seller?.shop?.name || 'Not set'}
                </p>
                <p style={styles.shopInfoItem}>
                  <span style={styles.shopInfoLabel}>Category:</span> {sellerAuth.seller?.shop?.category || 'Not set'}
                </p>
                
                <div style={styles.realtimeStatus}>
                  <div style={styles.realtimeIndicator}>
                    <div style={styles.realtimeDot}></div>
                    <span style={styles.realtimeText}>Real-time updates active</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main style={styles.mainContent}>
            <div style={{ maxWidth: '100%' }}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <p>&copy; {new Date().getFullYear()} Zammer Marketplace. All rights reserved.</p>
          {process.env.NODE_ENV === 'development' && (
            <p style={styles.devInfo}>
              Development Mode | Route: {location.pathname}
            </p>
          )}
        </div>
      </footer>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @media (min-width: 640px) {
          .userName { display: inline !important; }
        }
        
        @media (min-width: 1024px) {
          .mainContainer { flex-direction: row !important; }
        }
      `}</style>
    </div>
  );
};

export default SellerLayout;