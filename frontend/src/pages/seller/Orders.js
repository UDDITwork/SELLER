import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../contexts/AuthContext';
import SellerLayout from '../../components/layouts/SellerLayout';
import orderService from '../../services/orderService';
import socketService from '../../services/socketService';
import { toast } from 'react-toastify';

const Orders = () => {
  const { sellerAuth } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Pending');
  const [stats, setStats] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // Order status mapping to match your requirements
  const statusTabs = [
    { key: 'Pending', label: 'Pending', icon: '⏳', color: 'yellow' },
    { key: 'Processing', label: 'Ready to Ship', icon: '📦', color: 'blue' },
    { key: 'Shipped', label: 'Shipped', icon: '🚚', color: 'purple' },
    { key: 'Cancelled', label: 'Cancelled', icon: '❌', color: 'red' }
  ];

  // Setup Socket.io connection and listeners
  useEffect(() => {
    if (sellerAuth?.seller?._id) {
      console.log('🔌 Setting up socket connection for seller:', sellerAuth.seller._id);
      
      // Connect to socket
      const socket = socketService.connect();
      
      if (socket) {
        // Join seller room
        socketService.joinSellerRoom(sellerAuth.seller._id);
        
        // Listen for new orders
        socketService.onNewOrder((data) => {
          console.log('📦 New order received via socket:', data);
          toast.success(`New order received! Order #${data.data.orderNumber}`, {
            position: "top-right",
            autoClose: 5000,
          });
          
          // Refresh orders
          fetchOrders();
          fetchStats();
        });

        // Listen for order status updates
        socketService.onOrderStatusUpdate((data) => {
          console.log('🔄 Order status updated via socket:', data);
          toast.info(`Order #${data.data.orderNumber} status updated to ${data.data.status}`, {
            position: "top-right",
            autoClose: 3000,
          });
          
          // Refresh orders
          fetchOrders();
        });

        // Check connection status
        const checkConnection = () => {
          const status = socketService.getConnectionStatus();
          setSocketConnected(status.isConnected);
        };

        // Check connection every 5 seconds
        const connectionInterval = setInterval(checkConnection, 5000);
        checkConnection(); // Initial check

        // Cleanup on unmount
        return () => {
          clearInterval(connectionInterval);
          socketService.removeListener('new-order');
          socketService.removeListener('order-status-updated');
        };
      }
    }
  }, [sellerAuth?.seller?._id]);

  // Fetch orders data
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await orderService.getSellerOrders(1, 100); // Get all orders
      
      if (response.success) {
        setOrders(response.data);
        console.log('✅ Orders fetched successfully:', response.data.length);
      } else {
        console.error('❌ Failed to fetch orders:', response.message);
        toast.error(response.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      toast.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  // Fetch order statistics
  const fetchStats = async () => {
    try {
      const response = await orderService.getSellerOrderStats();
      
      if (response.success) {
        setStats(response.data);
        console.log('✅ Order stats fetched:', response.data);
      }
    } catch (error) {
      console.error('❌ Error fetching order stats:', error);
    }
  };

  // Filter orders based on active tab
  useEffect(() => {
    if (orders.length > 0) {
      const filtered = orders.filter(order => {
        if (activeTab === 'Processing') {
          // "Ready to Ship" corresponds to Processing status
          return order.status === 'Processing';
        }
        return order.status === activeTab;
      });
      setFilteredOrders(filtered);
      console.log(`📊 Filtered orders for ${activeTab}:`, filtered.length);
    } else {
      setFilteredOrders([]);
    }
  }, [orders, activeTab]);

  // Initial data fetch
  useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  // Handle status update
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      console.log('🔄 Updating order status:', { orderId, newStatus });
      
      const response = await orderService.updateOrderStatus(orderId, newStatus);
      
      if (response.success) {
        toast.success(`Order status updated to ${newStatus}`);
        fetchOrders(); // Refresh orders
      } else {
        toast.error(response.message || 'Failed to update order status');
      }
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      toast.error('Error updating order status');
    }
  };

  // Get status color classes
  const getStatusColor = (status) => {
    const statusMap = {
      'Pending': { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
      'Processing': { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
      'Shipped': { backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #a5b4fc' },
      'Delivered': { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' },
      'Cancelled': { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }
    };
    return statusMap[status] || { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
  };

  // Get tab color classes
  const getTabColor = (tabKey) => {
    const tab = statusTabs.find(t => t.key === tabKey);
    if (!tab) return { borderColor: '#d1d5db', color: '#6b7280' };
    
    const colorMap = {
      'yellow': { borderColor: '#f59e0b', color: '#92400e', backgroundColor: '#fef3c7' },
      'blue': { borderColor: '#3b82f6', color: '#1e40af', backgroundColor: '#dbeafe' },
      'purple': { borderColor: '#8b5cf6', color: '#5b21b6', backgroundColor: '#e9d5ff' },
      'red': { borderColor: '#ef4444', color: '#991b1b', backgroundColor: '#fee2e2' }
    };
    
    return colorMap[tab.color] || { borderColor: '#d1d5db', color: '#6b7280' };
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <SellerLayout>
      <style jsx>{`
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 50%, rgba(254, 215, 170, 0.3) 100%);
        }

        .main-wrapper {
          max-width: 1536px;
          margin: 0 auto;
          padding: 1.5rem 1rem;
        }

        @media (min-width: 640px) {
          .main-wrapper {
            padding: 2rem 1.5rem;
          }
        }

        @media (min-width: 1024px) {
          .main-wrapper {
            padding: 2rem 2rem;
          }
        }

        /* Header Styles */
        .header {
          position: relative;
          margin-bottom: 2rem;
        }

        .header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, #3b82f6, #06b6d4);
          border-radius: 1.5rem;
          transform: rotate(1deg);
          opacity: 0.1;
        }

        .header-content {
          position: relative;
          background: white;
          border-radius: 1.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid #f3f4f6;
          padding: 2rem;
        }

        .header-inner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left h1 {
          font-size: 2rem;
          font-weight: bold;
          background: linear-gradient(45deg, #111827, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0 0 0.5rem 0;
        }

        .header-left p {
          color: #6b7280;
          margin: 0;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .live-indicator {
          display: inline-flex;
          align-items: center;
          margin-left: 0.5rem;
        }

        .live-dot {
          width: 0.5rem;
          height: 0.5rem;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
          margin-right: 0.25rem;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .live-text {
          font-size: 0.75rem;
          color: #059669;
          font-weight: 500;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .stats-card {
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          padding: 1rem;
          text-align: center;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .stats-label {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .stats-value {
          font-size: 1.5rem;
          font-weight: bold;
          color: #f97316;
          margin: 0;
        }

        .refresh-btn {
          background: linear-gradient(45deg, #f97316, #f59e0b);
          color: white;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          text-decoration: none;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }

        .refresh-btn:hover {
          background: linear-gradient(45deg, #ea580c, #d97706);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .refresh-icon {
          width: 1rem;
          height: 1rem;
          margin-right: 0.5rem;
        }

        @media (max-width: 768px) {
          .header-left h1 {
            font-size: 1.5rem;
          }
          .header-inner {
            flex-direction: column;
            align-items: stretch;
          }
          .header-right {
            justify-content: space-between;
          }
        }

        /* Statistics Cards */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        @media (min-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          background: white;
          border-radius: 0.75rem;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
          cursor: pointer;
        }

        .stat-card:hover {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .stat-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .stat-info p {
          font-size: 0.875rem;
          font-weight: 500;
          color: #6b7280;
          margin: 0 0 0.25rem 0;
        }

        .stat-info .number {
          font-size: 1.5rem;
          font-weight: bold;
          color: #111827;
          margin: 0;
        }

        .stat-icon {
          font-size: 1.5rem;
        }

        /* Tab Navigation */
        .tab-nav {
          border-bottom: 1px solid #e5e7eb;
          margin-bottom: 1.5rem;
          overflow-x: auto;
        }

        .tab-list {
          display: flex;
          gap: 0;
          min-width: max-content;
        }

        .tab-button {
          padding: 1rem 1.5rem;
          border-bottom: 2px solid transparent;
          font-weight: 500;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
          color: #6b7280;
          background: none;
          border-left: none;
          border-right: none;
          border-top: none;
          cursor: pointer;
          white-space: nowrap;
        }

        .tab-button:hover {
          color: #374151;
          border-bottom-color: #d1d5db;
        }

        .tab-button.active {
          color: #f97316;
          border-bottom-color: #f97316;
        }

        .tab-icon {
          margin-right: 0.25rem;
        }

        .tab-badge {
          margin-left: 0.5rem;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          border-radius: 9999px;
          background: #f3f4f6;
          color: #6b7280;
        }

        .tab-button.active .tab-badge {
          background: #fed7aa;
          color: #c2410c;
        }

        /* Orders List */
        .orders-container {
          background: white;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          overflow: hidden;
        }

        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 3rem;
        }

        .spinner {
          animation: spin 1s linear infinite;
          border-radius: 50%;
          width: 2rem;
          height: 2rem;
          border: 2px solid transparent;
          border-top: 2px solid #f97316;
          margin-right: 0.75rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          color: #6b7280;
          font-weight: 500;
        }

        .orders-list {
          display: flex;
          flex-direction: column;
        }

        .order-item {
          padding: 1.5rem;
          border-bottom: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }

        .order-item:hover {
          background: #f9fafb;
        }

        .order-item:last-child {
          border-bottom: none;
        }

        .order-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .order-left {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .order-info .order-number {
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.25rem 0;
          font-size: 1.125rem;
        }

        .order-info .order-date {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .status-badge {
          padding: 0.5rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          white-space: nowrap;
        }

        .order-right {
          text-align: right;
        }

        .order-price {
          font-weight: bold;
          color: #111827;
          margin: 0 0 0.25rem 0;
          font-size: 1.125rem;
        }

        .order-payment {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        /* Customer Info */
        .customer-info {
          margin: 1rem 0;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.75rem;
          border: 1px solid #f3f4f6;
        }

        .customer-title {
          font-weight: 500;
          color: #111827;
          margin: 0 0 0.75rem 0;
        }

        .customer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0.75rem;
          font-size: 0.875rem;
        }

        @media (min-width: 768px) {
          .customer-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .customer-field {
          display: flex;
        }

        .field-label {
          color: #6b7280;
          margin-right: 0.5rem;
          min-width: 4rem;
        }

        .field-value {
          font-weight: 500;
          color: #111827;
        }

        /* Order Items */
        .order-items {
          margin: 1rem 0;
        }

        .items-title {
          font-weight: 500;
          color: #111827;
          margin: 0 0 0.75rem 0;
        }

        .items-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 0.5rem;
        }

        .item-image {
          width: 3rem;
          height: 3rem;
          background: #e5e7eb;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .item-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .item-placeholder-icon {
          width: 1.5rem;
          height: 1.5rem;
          color: #9ca3af;
        }

        .item-details {
          flex: 1;
          min-width: 0;
        }

        .item-name {
          font-weight: 500;
          color: #111827;
          margin: 0 0 0.25rem 0;
          word-break: break-word;
        }

        .item-specs {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .item-price {
          text-align: right;
          flex-shrink: 0;
        }

        .item-price p {
          font-weight: 500;
          color: #111827;
          margin: 0;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .btn-processing {
          background: #3b82f6;
          color: white;
        }

        .btn-processing:hover {
          background: #2563eb;
        }

        .btn-cancel {
          background: #ef4444;
          color: white;
        }

        .btn-cancel:hover {
          background: #dc2626;
        }

        .btn-shipped {
          background: #8b5cf6;
          color: white;
        }

        .btn-shipped:hover {
          background: #7c3aed;
        }

        .btn-delivered {
          background: #10b981;
          color: white;
        }

        .btn-delivered:hover {
          background: #059669;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
        }

        .empty-icon {
          width: 4rem;
          height: 4rem;
          margin: 0 auto 1rem auto;
          color: #9ca3af;
        }

        .empty-title {
          color: #6b7280;
          font-size: 1.125rem;
          margin: 0 0 0.5rem 0;
          font-weight: 500;
        }

        .empty-subtitle {
          color: #9ca3af;
          font-size: 0.875rem;
          margin: 0;
        }

        @media (max-width: 768px) {
          .main-wrapper {
            padding: 1rem;
          }
          
          .header-content {
            padding: 1.5rem;
          }
          
          .order-item {
            padding: 1rem;
          }
          
          .order-header {
            flex-direction: column;
            align-items: stretch;
          }
          
          .order-right {
            text-align: left;
          }
          
          .customer-grid {
            grid-template-columns: 1fr;
          }
          
          .action-buttons {
            justify-content: stretch;
          }
          
          .action-btn {
            flex: 1;
            text-align: center;
          }
        }
      `}</style>
      
      <div className="container">
        <div className="main-wrapper">
          {/* Header Section */}
          <div className="header">
            <div className="header-content">
              <div className="header-inner">
                <div className="header-left">
                  <h1>Orders Management</h1>
                  <p>
                    Manage and track all your orders
                    {socketConnected && (
                      <span className="live-indicator">
                        <span className="live-dot"></span>
                        <span className="live-text">Live updates</span>
                      </span>
                    )}
                  </p>
                </div>
                
                <div className="header-right">
                  {stats && (
                    <div className="stats-card">
                      <p className="stats-label">Today's Orders</p>
                      <p className="stats-value">{stats.todayOrdersCount || 0}</p>
                    </div>
                  )}
                  
                  <button
                    onClick={() => {
                      fetchOrders();
                      fetchStats();
                    }}
                    className="refresh-btn"
                  >
                    <svg className="refresh-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {stats && (
            <div className="stats-grid">
              {statusTabs.map((tab) => {
                const count = stats.statusCounts?.[tab.key] || 0;
                const tabColor = getTabColor(tab.key);
                return (
                  <div
                    key={tab.key}
                    className="stat-card"
                    onClick={() => setActiveTab(tab.key)}
                    style={activeTab === tab.key ? {
                      borderColor: tabColor.borderColor,
                      backgroundColor: tabColor.backgroundColor
                    } : {}}
                  >
                    <div className="stat-content">
                      <div className="stat-info">
                        <p style={{ color: activeTab === tab.key ? tabColor.color : '#6b7280' }}>
                          {tab.label}
                        </p>
                        <p className="number" style={{ color: activeTab === tab.key ? tabColor.color : '#111827' }}>
                          {count}
                        </p>
                      </div>
                      <div className="stat-icon">{tab.icon}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="tab-nav">
            <div className="tab-list">
              {statusTabs.map((tab) => {
                const count = stats?.statusCounts?.[tab.key] || 0;
                const isActive = activeTab === tab.key;
                
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`tab-button ${isActive ? 'active' : ''}`}
                  >
                    <span className="tab-icon">{tab.icon}</span>
                    <span>{tab.label}</span>
                    {count > 0 && (
                      <span className="tab-badge">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders List */}
          <div className="orders-container">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <span className="loading-text">Loading orders...</span>
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="orders-list">
                {filteredOrders.map((order) => (
                  <div key={order._id} className="order-item">
                    <div className="order-header">
                      <div className="order-left">
                        <div className="order-info">
                          <p className="order-number">Order #{order.orderNumber}</p>
                          <p className="order-date">{formatDate(order.createdAt)}</p>
                        </div>
                        <span className="status-badge" style={getStatusColor(order.status)}>
                          {order.status}
                        </span>
                      </div>
                      
                      <div className="order-right">
                        <p className="order-price">₹{order.totalPrice}</p>
                        <p className="order-payment">{order.paymentMethod}</p>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="customer-info">
                      <h4 className="customer-title">Customer Details</h4>
                      <div className="customer-grid">
                        <div className="customer-field">
                          <span className="field-label">Name:</span>
                          <span className="field-value">{order.user?.name}</span>
                        </div>
                        <div className="customer-field">
                          <span className="field-label">Email:</span>
                          <span className="field-value">{order.user?.email}</span>
                        </div>
                        <div className="customer-field">
                          <span className="field-label">Phone:</span>
                          <span className="field-value">{order.user?.mobileNumber || order.shippingAddress?.phone}</span>
                        </div>
                        <div className="customer-field">
                          <span className="field-label">City:</span>
                          <span className="field-value">{order.shippingAddress?.city}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="order-items">
                      <h4 className="items-title">Order Items</h4>
                      <div className="items-list">
                        {order.orderItems?.map((item, index) => (
                          <div key={index} className="item">
                            <div className="item-image">
                              {item.image ? (
                                <img 
                                  src={item.image} 
                                  alt={item.name}
                                />
                              ) : (
                                <svg className="item-placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                              )}
                            </div>
                            <div className="item-details">
                              <p className="item-name">{item.name}</p>
                              <p className="item-specs">
                                Qty: {item.quantity} | Size: {item.size} | Color: {item.color}
                              </p>
                            </div>
                            <div className="item-price">
                              <p>₹{item.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="action-buttons">
                      {order.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'Processing')}
                            className="action-btn btn-processing"
                          >
                            Mark Ready to Ship
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(order._id, 'Cancelled')}
                            className="action-btn btn-cancel"
                          >
                            Cancel Order
                          </button>
                        </>
                      )}
                      
                      {order.status === 'Processing' && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, 'Shipped')}
                          className="action-btn btn-shipped"
                        >
                          Mark as Shipped
                        </button>
                      )}
                      
                      {order.status === 'Shipped' && (
                        <button
                          onClick={() => handleStatusUpdate(order._id, 'Delivered')}
                          className="action-btn btn-delivered"
                        >
                          Mark as Delivered
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div>
                  <svg className="empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="empty-title">No {activeTab.toLowerCase()} orders found</p>
                <p className="empty-subtitle">
                  {activeTab === 'Pending' 
                    ? 'New orders will appear here when customers make purchases.'
                    : `No orders with ${activeTab.toLowerCase()} status at the moment.`
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </SellerLayout>
  );
};

export default Orders;