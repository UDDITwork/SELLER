import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import SellerLayout from '../../components/layouts/SellerLayout';
import { getSellerProducts } from '../../services/productService';
import orderService from '../../services/orderService';
import socketService from '../../services/socketService';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const { sellerAuth } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [socketConnected, setSocketConnected] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState([]);

  // Setup Socket.io connection and real-time notifications
  useEffect(() => {
    if (sellerAuth?.seller?._id) {
      console.log('🔌 Dashboard: Setting up socket connection for seller:', sellerAuth.seller._id);
      
      // Connect to socket
      const socket = socketService.connect();
      
      if (socket) {
        // Join seller room
        socketService.joinSellerRoom(sellerAuth.seller._id);
        
        // Listen for new orders
        socketService.onNewOrder((data) => {
          console.log('📦 Dashboard: New order received via socket:', data);
          
          // Show notification
          toast.success(
            `New Order Received! Order #${data.data.orderNumber} - ₹${data.data.totalPrice}`,
            {
              position: "top-right",
              autoClose: 8000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
            }
          );
          
          // Add to recent notifications
          setRecentNotifications(prev => [{
            id: data.data._id,
            type: 'new-order',
            message: `New order #${data.data.orderNumber}`,
            amount: data.data.totalPrice,
            timestamp: new Date().toISOString(),
            data: data.data
          }, ...prev.slice(0, 4)]); // Keep only last 5 notifications
          
          // Refresh data
          fetchSellerOrders();
          fetchOrderStats();
        });

        // Listen for order status updates
        socketService.onOrderStatusUpdate((data) => {
          console.log('🔄 Dashboard: Order status updated via socket:', data);
          
          toast.info(`Order #${data.data.orderNumber} status updated to ${data.data.status}`, {
            position: "top-right",
            autoClose: 5000,
          });
          
          // Add to recent notifications
          setRecentNotifications(prev => [{
            id: data.data._id,
            type: 'status-update',
            message: `Order #${data.data.orderNumber} ${data.data.status}`,
            timestamp: new Date().toISOString(),
            data: data.data
          }, ...prev.slice(0, 4)]);
          
          // Refresh data
          fetchSellerOrders();
        });

        // Check connection status
        const checkConnection = () => {
          const status = socketService.getConnectionStatus();
          setSocketConnected(status.isConnected);
        };

        // Check connection every 10 seconds
        const connectionInterval = setInterval(checkConnection, 10000);
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getSellerProducts();
        if (response.success) {
          setProducts(response.data);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
    fetchSellerOrders();
    fetchOrderStats();
  }, []);

  const fetchSellerOrders = async () => {
    setLoadingOrders(true);
    try {
      const ordersResponse = await orderService.getSellerOrders(1, 5);
      if (ordersResponse.success) {
        setOrders(ordersResponse.data);
      }
    } catch (error) {
      console.error('Error fetching seller orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchOrderStats = async () => {
    try {
      const statsResponse = await orderService.getSellerOrderStats();
      if (statsResponse.success) {
        setOrderStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error fetching order stats:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' };
      case 'processing':
        return { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' };
      case 'shipped':
        return { backgroundColor: '#e0e7ff', color: '#3730a3', border: '1px solid #a5b4fc' };
      case 'delivered':
        return { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #6ee7b7' };
      case 'cancelled':
        return { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' };
      default:
        return { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  // Get shop main image
  const getShopMainImage = () => {
    const shop = sellerAuth.seller?.shop;
    if (shop?.mainImage) {
      return shop.mainImage;
    }
    if (shop?.images && shop.images.length > 0) {
      return shop.images[0];
    }
    return null;
  };

  // Format time for notifications
  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Calculate stats
  const totalRevenue = orderStats?.totalRevenue || 0;
  const totalOrders = Object.values(orderStats?.statusCounts || {}).reduce((a, b) => a + b, 0);
  const pendingOrders = orderStats?.statusCounts?.Pending || 0;
  const todayOrders = orderStats?.todayOrdersCount || 0;

  return (
    <SellerLayout>
      <style jsx>{`
        .dashboard-container {
          min-height: 100vh;
          background: #f9fafb;
          padding: 1rem;
        }

        @media (min-width: 640px) {
          .dashboard-container {
            padding: 1.5rem;
          }
        }

        @media (min-width: 1024px) {
          .dashboard-container {
            padding: 2rem;
          }
        }

        /* Header Styles */
        .welcome-header {
          position: relative;
          margin-bottom: 2rem;
        }

        .welcome-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, #f97316, #f59e0b);
          border-radius: 1.5rem;
          opacity: 0.1;
        }

        .welcome-content {
          position: relative;
          background: white;
          border-radius: 1.5rem;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        @media (min-width: 1024px) {
          .welcome-content {
            padding: 2rem;
          }
        }

        .welcome-inner {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        @media (min-width: 1024px) {
          .welcome-inner {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .welcome-text h1 {
          font-size: 1.5rem;
          font-weight: bold;
          color: #111827;
          margin: 0 0 0.5rem 0;
        }

        @media (min-width: 1024px) {
          .welcome-text h1 {
            font-size: 2.25rem;
          }
        }

        .welcome-text p {
          color: #6b7280;
          font-size: 1rem;
          margin: 0;
        }

        @media (min-width: 1024px) {
          .welcome-text p {
            font-size: 1.125rem;
          }
        }

        .add-product-btn {
          width: 100%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(45deg, #f97316, #f59e0b);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          transition: all 0.2s;
        }

        @media (min-width: 1024px) {
          .add-product-btn {
            width: auto;
          }
        }

        .add-product-btn:hover {
          background: linear-gradient(45deg, #ea580c, #d97706);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        /* Status Bar */
        .status-bar {
          background: white;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          padding: 1rem;
          margin-bottom: 1.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .status-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        @media (min-width: 640px) {
          .status-content {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
          }
        }

        .status-left {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 1rem;
        }

        .connection-status {
          display: flex;
          align-items: center;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          border: 1px solid;
        }

        .connection-status.connected {
          background: #d1fae5;
          border-color: #6ee7b7;
          color: #065f46;
        }

        .connection-status.connecting {
          background: #fef3c7;
          border-color: #fcd34d;
          color: #92400e;
        }

        .status-dot {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 50%;
          margin-right: 0.5rem;
        }

        .status-dot.connected {
          background: #10b981;
          animation: pulse 2s infinite;
        }

        .status-dot.connecting {
          background: #f59e0b;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .new-orders-badge {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #991b1b;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          text-decoration: none;
          transition: background-color 0.2s;
        }

        .new-orders-badge:hover {
          background: #fecaca;
        }

        .pulse-dot {
          width: 0.5rem;
          height: 0.5rem;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 2s infinite;
          margin-right: 0.5rem;
        }

        .last-updated {
          color: #6b7280;
          font-size: 0.875rem;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 640px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          background: white;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.2s;
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
          margin: 0 0 0.25rem 0;
        }

        .stat-info .number {
          font-size: 1.875rem;
          font-weight: bold;
          color: #111827;
          margin: 0;
        }

        .stat-info .change {
          font-size: 0.875rem;
          margin: 0.25rem 0 0 0;
        }

        .stat-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .revenue .stat-info p { color: #059669; }
        .revenue .stat-info .change { color: #10b981; }
        .revenue .stat-icon { background: #d1fae5; color: #059669; }

        .orders .stat-info p { color: #2563eb; }
        .orders .stat-info .change { color: #3b82f6; }
        .orders .stat-icon { background: #dbeafe; color: #2563eb; }

        .pending .stat-info p { color: #d97706; }
        .pending .stat-info .change { color: #f59e0b; }
        .pending .stat-icon { background: #fef3c7; color: #d97706; }

        .products .stat-info p { color: #7c3aed; }
        .products .stat-info .change { color: #8b5cf6; }
        .products .stat-icon { background: #e9d5ff; color: #7c3aed; }

        /* Main Content Grid */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 1024px) {
          .main-grid {
            grid-template-columns: 2fr 1fr;
          }
        }

        .left-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .right-column {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* Card Styles */
        .card {
          background: white;
          border-radius: 1rem;
          border: 1px solid #e5e7eb;
          padding: 1.5rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .card-title {
          font-size: 1.25rem;
          font-weight: bold;
          color: #111827;
          margin: 0;
          display: flex;
          align-items: center;
        }

        .card-title svg {
          width: 1.5rem;
          height: 1.5rem;
          margin-right: 0.5rem;
        }

        .card-action {
          color: #f97316;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: color 0.2s;
        }

        .card-action:hover {
          color: #ea580c;
        }

        .btn {
          background: #dbeafe;
          border: 1px solid #93c5fd;
          color: #1e40af;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          transition: background-color 0.2s;
        }

        .btn:hover {
          background: #bfdbfe;
        }

        /* Loading Spinner */
        .loading-container {
          display: flex;
          justify-content: center;
          padding: 2rem;
        }

        .spinner {
          animation: spin 1s linear infinite;
          border-radius: 50%;
          width: 2rem;
          height: 2rem;
          border: 2px solid transparent;
          border-top: 2px solid #f97316;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Notifications */
        .notification-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .notification-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.75rem;
          border: 1px solid #f3f4f6;
        }

        .notification-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .notification-dot {
          width: 0.75rem;
          height: 0.75rem;
          border-radius: 50%;
        }

        .notification-dot.new-order {
          background: #10b981;
          animation: pulse 2s infinite;
        }

        .notification-dot.status-update {
          background: #3b82f6;
        }

        .notification-info p {
          margin: 0;
        }

        .notification-info .message {
          font-weight: 500;
          color: #111827;
        }

        .notification-info .time {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .notification-amount {
          font-size: 1.125rem;
          font-weight: bold;
          color: #059669;
        }

        /* Orders List */
        .orders-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .order-item {
          padding: 1rem;
          background: #f9fafb;
          border-radius: 0.75rem;
          border: 1px solid #f3f4f6;
          transition: background-color 0.2s;
        }

        .order-item:hover {
          background: #f3f4f6;
        }

        .order-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .order-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .order-info .order-number {
          font-weight: 500;
          color: #111827;
          margin: 0;
        }

        .order-info .customer-name {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .order-right {
          text-align: right;
        }

        .order-price {
          font-weight: bold;
          color: #111827;
          margin: 0;
        }

        .order-date {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        /* Empty State */
        .empty-state {
          text-align: center;
          padding: 3rem;
        }

        .empty-icon {
          width: 4rem;
          height: 4rem;
          background: #dbeafe;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem auto;
        }

        .empty-title {
          color: #6b7280;
          font-size: 1.125rem;
          margin: 0 0 1rem 0;
        }

        .empty-subtitle {
          color: #9ca3af;
          font-size: 0.875rem;
          margin: 0;
        }

        /* Shop Preview */
        .shop-image {
          aspect-ratio: 16/9;
          background: #f3f4f6;
          border-radius: 0.75rem;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .shop-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .shop-details {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .shop-detail {
          display: flex;
          flex-direction: column;
        }

        .shop-detail .label {
          color: #6b7280;
          font-size: 0.875rem;
          margin: 0;
        }

        .shop-detail .value {
          font-weight: 500;
          color: #111827;
          margin: 0;
        }

        .shop-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .status-indicator {
          width: 0.5rem;
          height: 0.5rem;
          background: #10b981;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .status-text {
          color: #059669;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .edit-shop-btn {
          width: 100%;
          background: #e9d5ff;
          border: 1px solid #c4b5fd;
          color: #7c3aed;
          padding: 0.5rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          text-decoration: none;
          text-align: center;
          transition: background-color 0.2s;
          display: block;
        }

        .edit-shop-btn:hover {
          background: #ddd6fe;
        }

        /* Quick Actions */
        .quick-actions {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .action-btn {
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          font-weight: 500;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          text-decoration: none;
        }

        .action-btn svg {
          width: 1rem;
          height: 1rem;
          margin-right: 0.5rem;
        }

        .action-btn.orange {
          background: #fed7aa;
          border: 1px solid #fdba74;
          color: #c2410c;
        }

        .action-btn.orange:hover {
          background: #fcd34d;
        }

        .action-btn.blue {
          background: #dbeafe;
          border: 1px solid #93c5fd;
          color: #1d4ed8;
        }

        .action-btn.blue:hover {
          background: #bfdbfe;
        }

        .action-btn.green {
          background: #dcfce7;
          border: 1px solid #86efac;
          color: #15803d;
        }

        .action-btn.green:hover {
          background: #bbf7d0;
        }

        /* Metrics */
        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .metric-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem;
          background: #f9fafb;
          border-radius: 0.75rem;
        }

        .metric-label {
          color: #6b7280;
          font-size: 0.875rem;
        }

        .metric-value {
          color: #111827;
          font-weight: bold;
        }

        /* Products Preview */
        .products-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 640px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1280px) {
          .products-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .product-card {
          background: #f9fafb;
          border-radius: 0.75rem;
          border: 1px solid #f3f4f6;
          overflow: hidden;
          transition: all 0.2s;
        }

        .product-card:hover {
          background: #f3f4f6;
          transform: translateY(-2px);
        }

        .product-image {
          aspect-ratio: 1;
          background: #f3f4f6;
          position: relative;
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .product-card:hover .product-image img {
          transform: scale(1.05);
        }

        .product-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
        }

        .product-badges {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .product-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          color: white;
        }

        .product-badge.trending {
          background: rgba(239, 68, 68, 0.8);
        }

        .product-badge.limited {
          background: rgba(139, 92, 246, 0.8);
        }

        .product-details {
          padding: 1rem;
        }

        .product-name {
          font-weight: 600;
          color: #111827;
          margin: 0 0 0.5rem 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .product-pricing {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .product-prices {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .product-price {
          color: #f97316;
          font-weight: bold;
          font-size: 1.125rem;
        }

        .product-mrp {
          color: #9ca3af;
          font-size: 0.875rem;
          text-decoration: line-through;
        }

        .product-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .product-status {
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .product-status.active {
          background: #d1fae5;
          color: #065f46;
        }

        .product-status.paused {
          background: #fef3c7;
          color: #92400e;
        }

        .product-status.inactive {
          background: #fee2e2;
          color: #991b1b;
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 0.5rem;
          }
          
          .welcome-content {
            padding: 1rem;
          }
          
          .card {
            padding: 1rem;
          }
          
          .stat-card {
            padding: 1rem;
          }
          
          .main-grid {
            gap: 1rem;
          }
          
          .left-column,
          .right-column {
            gap: 1rem;
          }
        }
      `}</style>
      
      <div className="dashboard-container">
        {/* Welcome Header */}
        <div className="welcome-header">
          <div className="welcome-content">
            <div className="welcome-inner">
              <div className="welcome-text">
                <h1>Welcome back, {sellerAuth.seller?.firstName || 'Seller'}! 👋</h1>
                <p>Here's what's happening with your business today</p>
              </div>
              
              <div>
                <Link to="/seller/add-product" className="add-product-btn">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ marginRight: '0.5rem' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Product
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Status Bar */}
        <div className="status-bar">
          <div className="status-content">
            <div className="status-left">
              <div className={`connection-status ${socketConnected ? 'connected' : 'connecting'}`}>
                <div className={`status-dot ${socketConnected ? 'connected' : 'connecting'}`}></div>
                <span>{socketConnected ? 'Live Updates Active' : 'Connecting...'}</span>
              </div>
              
              {orderStats?.unreadOrdersCount > 0 && (
                <Link to="/seller/orders" className="new-orders-badge">
                  <span className="pulse-dot"></span>
                  {orderStats.unreadOrdersCount} New Orders
                </Link>
              )}
            </div>
            
            <div className="last-updated">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {/* Total Revenue */}
          <div className="stat-card revenue">
            <div className="stat-content">
              <div className="stat-info">
                <p>Total Revenue</p>
                <p className="number">₹{totalRevenue.toLocaleString()}</p>
                <p className="change">+12% from last month</p>
              </div>
              <div className="stat-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Orders */}
          <div className="stat-card orders">
            <div className="stat-content">
              <div className="stat-info">
                <p>Total Orders</p>
                <p className="number">{totalOrders}</p>
                <p className="change">All time orders</p>
              </div>
              <div className="stat-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pending Orders */}
          <div className="stat-card pending">
            <div className="stat-content">
              <div className="stat-info">
                <p>Pending Orders</p>
                <p className="number">{pendingOrders}</p>
                <p className="change">Need attention</p>
              </div>
              <div className="stat-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Products */}
          <div className="stat-card products">
            <div className="stat-content">
              <div className="stat-info">
                <p>Total Products</p>
                <p className="number">{loading ? '...' : products.length}</p>
                <p className="change">In your catalog</p>
              </div>
              <div className="stat-icon">
                <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="main-grid">
          {/* Recent Orders */}
          <div className="left-column">
            {/* Recent Notifications */}
            {recentNotifications.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#f97316' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Live Activity
                  </h2>
                  <Link to="/seller/orders" className="card-action">View All →</Link>
                </div>
                
                <div className="notification-list">
                  {recentNotifications.map((notification, index) => (
                    <div key={notification.id || index} className="notification-item">
                      <div className="notification-left">
                        <div className={`notification-dot ${notification.type === 'new-order' ? 'new-order' : 'status-update'}`}></div>
                        <div className="notification-info">
                          <p className="message">{notification.message}</p>
                          <p className="time">{formatNotificationTime(notification.timestamp)}</p>
                        </div>
                      </div>
                      {notification.amount && (
                        <span className="notification-amount">₹{notification.amount}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Orders List */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#3b82f6' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Recent Orders
                </h2>
                <Link to="/seller/orders" className="btn">Manage Orders</Link>
              </div>
              
              {loadingOrders ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                </div>
              ) : orders.length > 0 ? (
                <div className="orders-list">
                  {orders.slice(0, 5).map(order => (
                    <div key={order._id} className="order-item">
                      <div className="order-header">
                        <div className="order-left">
                          <div className="order-info">
                            <p className="order-number">Order #{order.orderNumber}</p>
                            <p className="customer-name">{order.user?.name}</p>
                          </div>
                          <span className="status-badge" style={getStatusColor(order.status)}>
                            {order.status}
                          </span>
                        </div>
                        <div className="order-right">
                          <p className="order-price">₹{order.totalPrice}</p>
                          <p className="order-date">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">
                    <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#3b82f6' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="empty-title">No orders yet</p>
                  <p className="empty-subtitle">Orders will appear here when customers make purchases</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="right-column">
            {/* Shop Preview Card */}
            <div className="card">
              <h3 className="card-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8b5cf6' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Your Shop
              </h3>
              
              <div>
                {getShopMainImage() && (
                  <div className="shop-image">
                    <img 
                      src={getShopMainImage()} 
                      alt={sellerAuth.seller?.shop?.name || 'Shop'} 
                    />
                  </div>
                )}
                
                <div className="shop-details">
                  <div className="shop-detail">
                    <p className="label">Shop Name</p>
                    <p className="value">{sellerAuth.seller?.shop?.name || 'Not set'}</p>
                  </div>
                  
                  <div className="shop-detail">
                    <p className="label">Category</p>
                    <p className="value">{sellerAuth.seller?.shop?.category || 'Not set'}</p>
                  </div>
                  
                  <div className="shop-detail">
                    <p className="label">Status</p>
                    <div className="shop-status">
                      <div className="status-indicator"></div>
                      <span className="status-text">Active</span>
                    </div>
                  </div>
                </div>
                
                <Link to="/seller/edit-profile" className="edit-shop-btn">
                  Edit Shop Details
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h3 className="card-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#f97316' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Quick Actions
              </h3>
              
              <div className="quick-actions">
                <Link to="/seller/add-product" className="action-btn orange">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Product
                </Link>
                
                <Link to="/seller/view-products" className="action-btn blue">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  View Products ({products.length})
                </Link>
                
                <Link to="/seller/orders" className="action-btn green">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Manage Orders
                </Link>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="card">
              <h3 className="card-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#10b981' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Today's Metrics
              </h3>
              
              <div className="metrics-list">
                <div className="metric-item">
                  <span className="metric-label">Orders Today</span>
                  <span className="metric-value">{todayOrders}</span>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">Active Products</span>
                  <span className="metric-value">{products.filter(p => p.status === 'active').length}</span>
                </div>
                
                <div className="metric-item">
                  <span className="metric-label">Inventory Items</span>
                  <span className="metric-value">
                    {products.reduce((total, product) => 
                      total + (product.variants?.reduce((variantTotal, variant) => 
                        variantTotal + (variant.quantity || 0), 0) || 0), 0
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Products Preview */}
        {products.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#8b5cf6' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Recent Products
              </h2>
              <Link to="/seller/view-products" className="card-action">View All Products →</Link>
            </div>
            
            <div className="products-grid">
              {products.slice(0, 4).map(product => (
                <div key={product._id} className="product-card">
                  <div className="product-image">
                    {product.images && product.images.length > 0 ? (
                      <img 
                        src={product.images[0]} 
                        alt={product.name} 
                      />
                    ) : (
                      <div className="product-placeholder">
                        <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Product badges */}
                    <div className="product-badges">
                      {product.isTrending && (
                        <span className="product-badge trending">🔥 Trending</span>
                      )}
                      {product.isLimitedEdition && (
                        <span className="product-badge limited">⭐ Limited</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="product-details">
                    <h3 className="product-name">{product.name}</h3>
                    <div className="product-pricing">
                      <div className="product-prices">
                        <span className="product-price">₹{product.zammerPrice}</span>
                        {product.mrp > product.zammerPrice && (
                          <span className="product-mrp">₹{product.mrp}</span>
                        )}
                      </div>
                    </div>
                    <div className="product-footer">
                      <span>Stock: {product.variants?.reduce((total, variant) => total + (variant.quantity || 0), 0) || 0}</span>
                      <span className={`product-status ${product.status}`}>
                        {product.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SellerLayout>
  );
};

export default Dashboard;