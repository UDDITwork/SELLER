import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import SellerLayout from '../../components/layouts/SellerLayout';
import { 
  getSellerProducts, 
  deleteProduct, 
  toggleLimitedEdition, 
  toggleTrending,
  updateProductStatus 
} from '../../services/productService';

const ViewProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toggleLoading, setToggleLoading] = useState({}); // Track loading state for individual toggles

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await getSellerProducts();
      if (response.success) {
        setProducts(response.data);
      } else {
        toast.error(response.message || 'Failed to fetch products');
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await deleteProduct(id);
      if (response.success) {
        toast.success('Product deleted successfully');
        setProducts(products.filter(product => product._id !== id));
      } else {
        toast.error(response.message || 'Failed to delete product');
      }
    } catch (error) {
      toast.error(error.message || 'Something went wrong');
    } finally {
      setConfirmDelete(null);
    }
  };

  // 🎯 FIXED: Efficient Limited Edition Toggle using specific API
  const handleLimitedEditionToggle = async (productId, currentStatus) => {
    setToggleLoading(prev => ({ ...prev, [`limited_${productId}`]: true }));
    
    try {
      console.log('🎯 Calling toggleLimitedEdition for product:', productId);
      const response = await toggleLimitedEdition(productId);
      
      if (response.success) {
        // Update the local state
        setProducts(prev => prev.map(p => 
          p._id === productId 
            ? { ...p, isLimitedEdition: response.data.isLimitedEdition }
            : p
        ));
        
        toast.success(`Product ${response.data.isLimitedEdition ? 'marked as' : 'removed from'} Limited Edition`);
      } else {
        toast.error(response.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error toggling Limited Edition:', error);
      toast.error(error.message || 'Something went wrong while updating the product');
    } finally {
      setToggleLoading(prev => ({ ...prev, [`limited_${productId}`]: false }));
    }
  };

  // 🎯 FIXED: Efficient Trending Toggle using specific API
  const handleTrendingToggle = async (productId, currentStatus) => {
    setToggleLoading(prev => ({ ...prev, [`trending_${productId}`]: true }));
    
    try {
      console.log('🔥 Calling toggleTrending for product:', productId);
      const response = await toggleTrending(productId);
      
      if (response.success) {
        // Update the local state
        setProducts(prev => prev.map(p => 
          p._id === productId 
            ? { ...p, isTrending: response.data.isTrending }
            : p
        ));
        
        toast.success(`Product ${response.data.isTrending ? 'marked as' : 'removed from'} Trending`);
      } else {
        toast.error(response.message || 'Failed to update product');
      }
    } catch (error) {
      console.error('Error toggling Trending:', error);
      toast.error(error.message || 'Something went wrong while updating the product');
    } finally {
      setToggleLoading(prev => ({ ...prev, [`trending_${productId}`]: false }));
    }
  };

  // 🎯 NEW: Handle Status Toggle (Active/Inactive)
  const handleStatusToggle = async (productId, currentStatus) => {
    setToggleLoading(prev => ({ ...prev, [`status_${productId}`]: true }));
    
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      console.log('📊 Calling updateProductStatus for product:', productId, 'to status:', newStatus);
      const response = await updateProductStatus(productId, newStatus);
      
      if (response.success) {
        // Update the local state
        setProducts(prev => prev.map(p => 
          p._id === productId 
            ? { ...p, status: response.data.status }
            : p
        ));
        
        toast.success(`Product ${response.data.status === 'active' ? 'activated' : 'paused'} successfully`);
      } else {
        toast.error(response.message || 'Failed to update product status');
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast.error(error.message || 'Something went wrong while updating the product status');
    } finally {
      setToggleLoading(prev => ({ ...prev, [`status_${productId}`]: false }));
    }
  };

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
      || product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory 
      ? product.category === selectedCategory
      : true;
    
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from products
  const categories = [...new Set(products.map(product => product.category))];

  return (
    <SellerLayout>
      <style jsx>{`
        .container {
          min-height: 100vh;
          background: linear-gradient(135deg, #f9fafb 0%, #ffffff 50%, rgba(139, 92, 246, 0.1) 100%);
        }

        .main-wrapper {
          max-width: 1536px;
          margin: 0 auto;
          padding: 2rem 1rem;
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
          margin-bottom: 3rem;
        }

        .header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(45deg, #8b5cf6, #ec4899, #6366f1);
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
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .header-icon {
          width: 4rem;
          height: 4rem;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .header-title {
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(45deg, #111827, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin: 0;
        }

        .header-subtitle {
          font-size: 1.125rem;
          color: #6b7280;
          margin: 0.5rem 0 0 0;
        }

        .add-product-btn {
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          transition: all 0.2s;
          display: flex;
          align-items: center;
        }

        .add-product-btn:hover {
          background: linear-gradient(45deg, #7c3aed, #db2777);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .add-icon {
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 0.5rem;
        }

        @media (max-width: 768px) {
          .header-title {
            font-size: 1.875rem;
          }
          .header-subtitle {
            font-size: 1rem;
          }
          .header-icon {
            width: 3rem;
            height: 3rem;
          }
          .header-inner {
            flex-direction: column;
            align-items: stretch;
          }
        }

        /* Filters Section */
        .filters-section {
          position: relative;
          margin-bottom: 2rem;
        }

        .filters-section::before {
          content: '';
          position: absolute;
          inset: -4px;
          background: linear-gradient(45deg, #3b82f6, #06b6d4);
          border-radius: 1rem;
          filter: blur(8px);
          opacity: 0.2;
        }

        .filters-content {
          position: relative;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          padding: 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .filters-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 1024px) {
          .filters-grid {
            grid-template-columns: 2fr 1fr 1fr;
          }
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.75rem;
        }

        .form-input {
          width: 100%;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid #e5e7eb;
          border-radius: 0.75rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          font-size: 1rem;
          backdrop-filter: blur(4px);
          transition: all 0.2s;
          box-sizing: border-box;
        }

        .form-input:focus {
          outline: none;
          border-color: #3b82f6;
          ring: 2px;
          ring-color: #3b82f6;
        }

        .search-input {
          position: relative;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          width: 1.25rem;
          height: 1.25rem;
          color: #9ca3af;
          pointer-events: none;
        }

        .search-input input {
          padding-left: 3rem;
        }

        .clear-btn {
          width: 100%;
          padding: 1rem;
          border: 2px solid #d1d5db;
          border-radius: 0.75rem;
          color: #374151;
          background: white;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .clear-btn:hover {
          background: #f9fafb;
        }

        /* Stats Summary */
        .stats-summary {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 768px) {
          .stats-summary {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .stat-card {
          position: relative;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 1rem;
          filter: blur(4px);
          opacity: 0.2;
          transition: opacity 0.3s;
        }

        .stat-card:hover::before {
          opacity: 0.3;
        }

        .stat-card:nth-child(1)::before {
          background: linear-gradient(45deg, #3b82f6, #06b6d4);
        }

        .stat-card:nth-child(2)::before {
          background: linear-gradient(45deg, #8b5cf6, #6366f1);
        }

        .stat-card:nth-child(3)::before {
          background: linear-gradient(45deg, #ec4899, #f43f5e);
        }

        .stat-card:nth-child(4)::before {
          background: linear-gradient(45px, #10b981, #059669);
        }

        .stat-content {
          position: relative;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          padding: 1.5rem;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.5);
          text-align: center;
        }

        .stat-number {
          font-size: 1.875rem;
          font-weight: bold;
          margin: 0 0 0.25rem 0;
        }

        .stat-label {
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0;
        }

        .stat-card:nth-child(1) .stat-number {
          color: #3b82f6;
        }

        .stat-card:nth-child(1) .stat-label {
          color: #1e40af;
        }

        .stat-card:nth-child(2) .stat-number {
          color: #8b5cf6;
        }

        .stat-card:nth-child(2) .stat-label {
          color: #7c3aed;
        }

        .stat-card:nth-child(3) .stat-number {
          color: #ec4899;
        }

        .stat-card:nth-child(3) .stat-label {
          color: #db2777;
        }

        .stat-card:nth-child(4) .stat-number {
          color: #10b981;
        }

        .stat-card:nth-child(4) .stat-label {
          color: #059669;
        }

        /* Loading Spinner */
        .loading-container {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.5);
          padding: 4rem;
          text-align: center;
        }

        .spinner-container {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .spinner {
          position: relative;
        }

        .spinner-outer {
          width: 4rem;
          height: 4rem;
          border: 4px solid #8b5cf6;
          border-top: 4px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .spinner-inner {
          position: absolute;
          inset: 0;
          width: 4rem;
          height: 4rem;
          border: 4px solid transparent;
          border-top: 4px solid #ec4899;
          border-radius: 50%;
          animation: spin 1.5s linear infinite reverse;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          margin-left: 1rem;
          color: #6b7280;
          font-weight: 500;
          font-size: 1.125rem;
        }

        /* Products Grid */
        .products-section {
          position: relative;
        }

        .products-section::before {
          content: '';
          position: absolute;
          inset: -4px;
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          border-radius: 1rem;
          filter: blur(8px);
          opacity: 0.2;
        }

        .products-content {
          position: relative;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(8px);
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.5);
          overflow: hidden;
        }

        .products-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
          padding: 2rem;
        }

        @media (min-width: 768px) {
          .products-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1280px) {
          .products-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .product-card {
          position: relative;
        }

        .product-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(45deg, #e5e7eb, #d1d5db);
          border-radius: 1rem;
          filter: blur(4px);
          opacity: 0.3;
          transition: opacity 0.3s;
        }

        .product-card:hover::before {
          opacity: 0.5;
        }

        .product-content {
          position: relative;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          border-radius: 1rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.5);
          overflow: hidden;
          transition: all 0.3s;
        }

        .product-card:hover .product-content {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        /* Product Image */
        .product-image {
          position: relative;
          height: 16rem;
          background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
          overflow: hidden;
        }

        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s;
        }

        .product-card:hover .product-image img {
          transform: scale(1.1);
        }

        .product-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          flex-direction: column;
        }

        .placeholder-icon {
          width: 4rem;
          height: 4rem;
          margin-bottom: 0.5rem;
        }

        .placeholder-text {
          font-size: 0.875rem;
          font-weight: 500;
        }

        /* Product Badges */
        .product-badges {
          position: absolute;
          top: 1rem;
          left: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .product-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: bold;
          color: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .badge-trending {
          background: linear-gradient(45deg, #ef4444, #f97316);
        }

        .badge-limited {
          background: linear-gradient(45deg, #8b5cf6, #6366f1);
        }

        /* Status Badge */
        .status-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: bold;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: all 0.2s;
        }

        .status-active {
          background: #10b981;
          color: white;
        }

        .status-active:hover {
          background: #059669;
        }

        .status-paused {
          background: #f59e0b;
          color: white;
        }

        .status-paused:hover {
          background: #d97706;
        }

        .status-inactive {
          background: #ef4444;
          color: white;
        }

        .status-inactive:hover {
          background: #dc2626;
        }

        .loading-status {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
        }

        .spinner-small {
          width: 0.75rem;
          height: 0.75rem;
          border: 1px solid transparent;
          border-top: 1px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 0.25rem;
        }

        /* Product Details */
        .product-details {
          padding: 1.5rem;
        }

        .product-name {
          font-weight: bold;
          font-size: 1.25rem;
          color: #111827;
          margin: 0 0 0.75rem 0;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }

        .product-name:hover {
          color: #8b5cf6;
        }

        .product-pricing {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .pricing-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .product-price {
          color: #8b5cf6;
          font-weight: bold;
          font-size: 1.5rem;
        }

        .product-mrp {
          color: #9ca3af;
          font-size: 0.875rem;
          text-decoration: line-through;
        }

        .discount-badge {
          background: #dcfce7;
          color: #166534;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .product-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.875rem;
          color: #6b7280;
          margin-bottom: 1.5rem;
        }

        .stock-info {
          font-weight: 500;
        }

        .stock-number {
          color: #111827;
          font-weight: bold;
        }

        .category-badge {
          background: #f3f4f6;
          color: #374151;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
        }

        /* Action Buttons */
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .main-actions {
          display: flex;
          gap: 0.75rem;
        }

        .action-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border-radius: 0.75rem;
          font-weight: 600;
          text-align: center;
          transition: all 0.2s;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
        }

        .btn-edit {
          background: linear-gradient(45deg, #3b82f6, #06b6d4);
          color: white;
        }

        .btn-edit:hover {
          background: linear-gradient(45deg, #2563eb, #0891b2);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .btn-delete {
          background: linear-gradient(45deg, #ef4444, #f97316);
          color: white;
        }

        .btn-delete:hover {
          background: linear-gradient(45deg, #dc2626, #ea580c);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        .btn-icon {
          width: 1rem;
          height: 1rem;
          margin-right: 0.5rem;
        }

        /* Toggle Actions */
        .toggle-actions {
          display: flex;
          gap: 0.5rem;
        }

        .toggle-btn {
          flex: 1;
          padding: 0.5rem 0.75rem;
          border-radius: 0.75rem;
          font-size: 0.75rem;
          font-weight: bold;
          transition: all 0.2s;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
        }

        .toggle-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .toggle-limited {
          background: linear-gradient(45deg, #8b5cf6, #6366f1);
          color: white;
        }

        .toggle-limited:hover:not(:disabled) {
          background: linear-gradient(45deg, #7c3aed, #4f46e5);
        }

        .toggle-limited.inactive {
          background: #f3f4f6;
          color: #6b7280;
        }

        .toggle-limited.inactive:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .toggle-trending {
          background: linear-gradient(45deg, #ec4899, #ef4444);
          color: white;
        }

        .toggle-trending:hover:not(:disabled) {
          background: linear-gradient(45deg, #db2777, #dc2626);
        }

        .toggle-trending.inactive {
          background: #f3f4f6;
          color: #6b7280;
        }

        .toggle-trending.inactive:hover:not(:disabled) {
          background: #e5e7eb;
        }

        /* Empty State */
        .empty-state {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.5);
          padding: 4rem 2rem;
          text-align: center;
        }

        .empty-icon {
          width: 8rem;
          height: 8rem;
          background: linear-gradient(135deg, #f3e8ff, #fce7f3);
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 2rem auto;
        }

        .empty-icon svg {
          width: 4rem;
          height: 4rem;
          color: #8b5cf6;
        }

        .empty-title {
          font-size: 1.875rem;
          font-weight: bold;
          color: #111827;
          margin: 0 0 1rem 0;
        }

        .empty-text {
          color: #6b7280;
          font-size: 1.125rem;
          margin: 0 0 2rem 0;
        }

        .empty-action {
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
          color: white;
          padding: 1rem 2rem;
          border-radius: 0.75rem;
          font-weight: 600;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          transition: all 0.2s;
        }

        .empty-action:hover {
          background: linear-gradient(45deg, #7c3aed, #db2777);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        /* Confirmation Dialog */
        .dialog-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 50;
          padding: 1rem;
        }

        .dialog {
          position: relative;
        }

        .dialog::before {
          content: '';
          position: absolute;
          inset: -2px;
          background: linear-gradient(45deg, #ef4444, #f97316);
          border-radius: 1rem;
          filter: blur(4px);
          opacity: 0.3;
        }

        .dialog-content {
          position: relative;
          background: white;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          padding: 2rem;
          max-width: 28rem;
          margin: 0 auto;
          text-align: center;
        }

        .dialog-icon {
          width: 4rem;
          height: 4rem;
          background: #fee2e2;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem auto;
        }

        .dialog-icon svg {
          width: 2rem;
          height: 2rem;
          color: #ef4444;
        }

        .dialog-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #111827;
          margin: 0 0 1rem 0;
        }

        .dialog-text {
          color: #6b7280;
          margin: 0 0 2rem 0;
          line-height: 1.6;
        }

        .dialog-actions {
          display: flex;
          gap: 1rem;
        }

        .dialog-btn {
          flex: 1;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }

        .btn-cancel {
          border: 2px solid #d1d5db;
          color: #374151;
          background: white;
        }

        .btn-cancel:hover {
          background: #f9fafb;
        }

        .btn-confirm {
          background: linear-gradient(45deg, #ef4444, #f97316);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .btn-confirm:hover {
          background: linear-gradient(45deg, #dc2626, #ea580c);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        }

        @media (max-width: 768px) {
          .main-wrapper {
            padding: 1rem;
          }
          
          .header-content {
            padding: 1.5rem;
          }
          
          .filters-content {
            padding: 1rem;
          }
          
          .filters-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          
          .products-grid {
            grid-template-columns: 1fr;
            padding: 1rem;
            gap: 1.5rem;
          }
          
          .product-details {
            padding: 1rem;
          }
          
          .main-actions {
            flex-direction: column;
          }
          
          .dialog-content {
            padding: 1.5rem;
            margin: 1rem;
          }
          
          .dialog-actions {
            flex-direction: column;
          }
        }
      `}</style>
      
      <div className="container">
        <div className="main-wrapper">
          
          {/* Premium Header */}
          <div className="header">
            <div className="header-content">
              <div className="header-inner">
                <div className="header-left">
                  <div className="header-icon">
                    <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="header-title">Your Products</h1>
                    <p className="header-subtitle">Manage your entire product catalog</p>
                  </div>
                </div>
                
                <Link to="/seller/add-product" className="add-product-btn">
                  <svg className="add-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add New Product
                </Link>
              </div>
            </div>
          </div>

          {/* Enhanced Filters */}
          <div className="filters-section">
            <div className="filters-content">
              <div className="filters-grid">
                <div className="form-group">
                  <label htmlFor="search" className="form-label">Search Products</label>
                  <div className="search-input">
                    <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      id="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or description..."
                      className="form-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="category" className="form-label">Filter by Category</label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="form-input"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
                    }}
                    className="clear-btn"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Stats Summary */}
          {products.length > 0 && (
            <div className="stats-summary">
              <div className="stat-card">
                <div className="stat-content">
                  <p className="stat-number">{products.length}</p>
                  <p className="stat-label">Total Products</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-content">
                  <p className="stat-number">{products.filter(p => p.isLimitedEdition).length}</p>
                  <p className="stat-label">Limited Edition</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-content">
                  <p className="stat-number">{products.filter(p => p.isTrending).length}</p>
                  <p className="stat-label">Trending</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-content">
                  <p className="stat-number">{products.filter(p => p.status === 'active').length}</p>
                  <p className="stat-label">Active</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading-container">
              <div className="spinner-container">
                <div className="spinner">
                  <div className="spinner-outer"></div>
                  <div className="spinner-inner"></div>
                </div>
                <span className="loading-text">Loading your products...</span>
              </div>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="products-section">
              <div className="products-content">
                <div className="products-grid">
                  {filteredProducts.map((product) => (
                    <div key={product._id} className="product-card">
                      <div className="product-content">
                        
                        {/* Product Image */}
                        <div className="product-image">
                          {product.images && product.images.length > 0 ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                            />
                          ) : (
                            <div className="product-placeholder">
                              <svg className="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="placeholder-text">No Image</span>
                            </div>
                          )}
                          
                          {/* Product Badges */}
                          <div className="product-badges">
                            {product.isTrending && (
                              <span className="product-badge badge-trending">🔥 Trending</span>
                            )}
                            {product.isLimitedEdition && (
                              <span className="product-badge badge-limited">⭐ Limited</span>
                            )}
                          </div>

                          {/* Status Badge */}
                          <div 
                            className={`status-badge ${
                              product.status === 'active' ? 'status-active' : 
                              product.status === 'paused' ? 'status-paused' : 'status-inactive'
                            } ${toggleLoading[`status_${product._id}`] ? 'loading-status' : ''}`}
                            onClick={() => !toggleLoading[`status_${product._id}`] && handleStatusToggle(product._id, product.status)}
                          >
                            {toggleLoading[`status_${product._id}`] ? (
                              <div className="loading-spinner">
                                <div className="spinner-small"></div>
                                ...
                              </div>
                            ) : (
                              product.status?.toUpperCase()
                            )}
                          </div>
                        </div>
                        
                        {/* Product Details */}
                        <div className="product-details">
                          <h3 className="product-name">{product.name}</h3>
                          
                          <div className="product-pricing">
                            <div className="pricing-left">
                              <span className="product-price">₹{product.zammerPrice}</span>
                              {product.mrp > product.zammerPrice && (
                                <span className="product-mrp">₹{product.mrp}</span>
                              )}
                            </div>
                            {product.mrp > product.zammerPrice && (
                              <span className="discount-badge">
                                {Math.round(((product.mrp - product.zammerPrice) / product.mrp) * 100)}% OFF
                              </span>
                            )}
                          </div>
                          
                          <div className="product-meta">
                            <span className="stock-info">
                              Stock: <span className="stock-number">{product.variants?.reduce((total, variant) => total + (variant.quantity || 0), 0) || 0}</span>
                            </span>
                            <span className="category-badge">{product.category}</span>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="action-buttons">
                            {/* Main Actions */}
                            <div className="main-actions">
                              <Link
                                to={`/seller/edit-product/${product._id}`}
                                className="action-btn btn-edit"
                              >
                                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit
                              </Link>
                              <button
                                onClick={() => setConfirmDelete(product._id)}
                                className="action-btn btn-delete"
                              >
                                <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            </div>
                            
                            {/* Toggle Actions */}
                            <div className="toggle-actions">
                              <button
                                onClick={() => handleLimitedEditionToggle(product._id, product.isLimitedEdition)}
                                disabled={toggleLoading[`limited_${product._id}`]}
                                className={`toggle-btn toggle-limited ${!product.isLimitedEdition ? 'inactive' : ''}`}
                              >
                                {toggleLoading[`limited_${product._id}`] ? (
                                  <div className="loading-spinner">
                                    <div className="spinner-small"></div>
                                    ...
                                  </div>
                                ) : (
                                  <>⭐ {product.isLimitedEdition ? 'Limited' : 'Make Limited'}</>
                                )}
                              </button>
                              
                              <button
                                onClick={() => handleTrendingToggle(product._id, product.isTrending)}
                                disabled={toggleLoading[`trending_${product._id}`]}
                                className={`toggle-btn toggle-trending ${!product.isTrending ? 'inactive' : ''}`}
                              >
                                {toggleLoading[`trending_${product._id}`] ? (
                                  <div className="loading-spinner">
                                    <div className="spinner-small"></div>
                                    ...
                                  </div>
                                ) : (
                                  <>🔥 {product.isTrending ? 'Trending' : 'Make Trending'}</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="empty-title">No products found</h3>
              {searchTerm || selectedCategory ? (
                <div>
                  <p className="empty-text">No products match your current filters</p>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
                    }}
                    className="empty-action"
                  >
                    Clear filters to show all products
                  </button>
                </div>
              ) : (
                <div>
                  <p className="empty-text">Start building your product catalog</p>
                  <Link
                    to="/seller/add-product"
                    className="empty-action"
                  >
                    <svg className="add-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Your First Product
                  </Link>
                </div>
              )}
            </div>
          )}
          
          {/* Premium Confirmation Dialog */}
          {confirmDelete && (
            <div className="dialog-overlay">
              <div className="dialog">
                <div className="dialog-content">
                  <div className="dialog-icon">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <h3 className="dialog-title">Delete Product</h3>
                  <p className="dialog-text">
                    Are you sure you want to delete this product? This action cannot be undone and will permanently remove the product from your catalog.
                  </p>
                  <div className="dialog-actions">
                    <button
                      onClick={() => setConfirmDelete(null)}
                      className="dialog-btn btn-cancel"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(confirmDelete)}
                      className="dialog-btn btn-confirm"
                    >
                      Delete Product
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
};

export default ViewProducts;