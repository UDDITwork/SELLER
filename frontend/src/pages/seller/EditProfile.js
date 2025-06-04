import React, { useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import SellerLayout from '../../components/layouts/SellerLayout';
import GooglePlacesAutocomplete from '../../components/GooglePlacesAutocomplete';
import { getSellerProfile, updateSellerProfile } from '../../services/sellerService';
import { AuthContext } from '../../contexts/AuthContext';

const ProfileSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  email: Yup.string()
    .email('Invalid email address')
    .required('Email is required'),
  mobileNumber: Yup.string().required('Mobile number is required'),
  shop: Yup.object().shape({
    name: Yup.string().required('Shop name is required'),
    address: Yup.string().required('Shop address is required'),
    category: Yup.string().required('Shop category is required'),
    description: Yup.string().max(500, 'Description cannot be more than 500 characters')
  })
});

// 🎯 NEW: Mock image upload function (same as AddProduct.js)
const mockImageUpload = async (file) => {
  try {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create base64 data URL for reliable image display
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result); // Returns base64 data URL
      };
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        // Fallback to a placeholder
        resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmMGYwZjAiLz4KPHRleHQgeD0iMTUwIiB5PSIxNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+U2hvcCBJbWFnZTwvdGV4dD4KPC9zdmc+');
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Image upload error:', error);
    // Return placeholder SVG
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmMGYwZjAiLz4KPHRleHQgeD0iMTUwIiB5PSIxNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+U2hvcCBJbWFnZTwvdGV4dD4KPC9zdmc+';
  }
};

const EditProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const { sellerAuth, loginSeller } = useContext(AuthContext);

  useEffect(() => {
    fetchSellerProfile();
  }, []);

  const fetchSellerProfile = async () => {
    setFetchLoading(true);
    try {
      const response = await getSellerProfile();
      if (response.success) {
        setProfile(response.data);
        
        // Set existing location data if available
        if (response.data.shop?.location) {
          setSelectedPlace({
            address: response.data.shop.address,
            coordinates: response.data.shop.location.coordinates
          });
        }
      } else {
        toast.error(response.message || 'Failed to fetch profile');
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setFetchLoading(false);
    }
  };

  const handlePlaceSelected = (placeData) => {
    console.log('Place selected in EditProfile:', placeData);
    setSelectedPlace(placeData);
    
    // Show success message
    toast.success('Address selected successfully!');
  };

  // 🎯 NEW: Handle shop image upload
  const handleShopImageUpload = async (e, setFieldValue, currentImages) => {
    setUploadingImages(true);
    try {
      const files = Array.from(e.target.files);
      const uploadedImages = [...(currentImages || [])];
      
      console.log('📸 Uploading shop images:', files.length);
      
      for (const file of files) {
        const imageUrl = await mockImageUpload(file);
        uploadedImages.push(imageUrl);
      }
      
      setFieldValue('shop.images', uploadedImages);
      
      // Set main image if not already set
      if (uploadedImages.length > 0 && !currentImages?.length) {
        setFieldValue('shop.mainImage', uploadedImages[0]);
      }
      
      toast.success(`${files.length} shop image(s) uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload shop images');
      console.error('Shop image upload error:', error);
    } finally {
      setUploadingImages(false);
    }
  };

  // 🎯 NEW: Remove shop image
  const removeShopImage = (index, setFieldValue, currentImages) => {
    const newImages = [...currentImages];
    const removedImage = newImages.splice(index, 1)[0];
    setFieldValue('shop.images', newImages);
    
    // If removed image was the main image, set new main image
    setFieldValue('shop.mainImage', newImages.length > 0 ? newImages[0] : '');
    
    toast.success('Shop image removed');
  };

  // 🎯 NEW: Set main image
  const setMainImage = (imageUrl, setFieldValue) => {
    setFieldValue('shop.mainImage', imageUrl);
    toast.success('Main shop image updated');
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    setIsLoading(true);
    try {
      // Prepare the data with location coordinates if available
      const submitData = {
        ...values,
        shop: {
          ...values.shop,
          // Include location coordinates if a place was selected
          ...(selectedPlace && selectedPlace.coordinates && {
            location: {
              type: 'Point',
              coordinates: selectedPlace.coordinates
            }
          })
        }
      };

      console.log('🔄 Submitting profile data with shop images:', {
        ...submitData,
        shop: {
          ...submitData.shop,
          imagesCount: submitData.shop.images?.length || 0,
          hasMainImage: !!submitData.shop.mainImage
        }
      });
      
      const response = await updateSellerProfile(submitData);
      
      if (response.success) {
        // Update auth context with new data
        loginSeller({
          ...sellerAuth.seller,
          ...response.data
        });
        
        toast.success('Profile updated successfully!');
      } else {
        toast.error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
      setSubmitting(false);
    }
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
          background: linear-gradient(45deg, #6366f1, #8b5cf6, #ec4899);
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
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .header-title {
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(45deg, #111827, #6366f1, #8b5cf6);
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

        .location-badge {
          display: flex;
          align-items: center;
          background: #ecfdf5;
          border: 1px solid #6ee7b7;
          border-radius: 0.75rem;
          padding: 0.5rem 1rem;
        }

        .location-icon {
          width: 1.25rem;
          height: 1.25rem;
          color: #10b981;
          margin-right: 0.5rem;
        }

        .location-text {
          color: #065f46;
          font-weight: 500;
          font-size: 0.875rem;
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
            align-items: flex-start;
          }
        }

        /* Loading Spinner */
        .loading-container {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.5);
          padding: 3rem;
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
          border: 4px solid #6366f1;
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
          border-top: 4px solid #8b5cf6;
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

        /* Form Styles */
        .form-container {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* Section Styles */
        .section {
          position: relative;
        }

        .section::before {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 1rem;
          filter: blur(8px);
          opacity: 0.2;
          transition: opacity 0.3s;
        }

        .section:hover::before {
          opacity: 0.3;
        }

        .section-blue::before {
          background: linear-gradient(45deg, #3b82f6, #06b6d4);
        }

        .section-orange::before {
          background: linear-gradient(45deg, #f97316, #f59e0b);
        }

        .section-purple::before {
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
        }

        .section-green::before {
          background: linear-gradient(45deg, #10b981, #059669);
        }

        .section-content {
          position: relative;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          padding: 2rem;
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .section-header {
          display: flex;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .section-icon {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          margin-right: 1rem;
          color: white;
        }

        .icon-blue {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
        }

        .icon-orange {
          background: linear-gradient(135deg, #f97316, #f59e0b);
        }

        .icon-purple {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
        }

        .icon-green {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .section-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #374151;
          margin: 0;
        }

        /* Grid Styles */
        .grid {
          display: grid;
          gap: 2rem;
        }

        .grid-cols-1 {
          grid-template-columns: 1fr;
        }

        .grid-cols-2 {
          grid-template-columns: repeat(2, 1fr);
        }

        .grid-cols-3 {
          grid-template-columns: repeat(3, 1fr);
        }

        .grid-cols-4 {
          grid-template-columns: repeat(4, 1fr);
        }

        @media (min-width: 1024px) {
          .lg\\:grid-cols-2 {
            grid-template-columns: repeat(2, 1fr);
          }
          .lg\\:grid-cols-3 {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 768px) {
          .md\\:grid-cols-2 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        /* Form Elements */
        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.75rem;
        }

        .form-input {
          display: block;
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

        .form-select {
          display: block;
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

        .form-select:focus {
          outline: none;
          border-color: #3b82f6;
          ring: 2px;
          ring-color: #3b82f6;
        }

        .form-textarea {
          resize: none;
          min-height: 120px;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          font-weight: 500;
        }

        /* Character Counter */
        .char-counter {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 0.5rem;
        }

        .char-count {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .char-count.warning {
          color: #f97316;
        }

        .progress-bar {
          width: 8rem;
          background: #e5e7eb;
          border-radius: 9999px;
          height: 0.5rem;
        }

        .progress-fill {
          height: 0.5rem;
          border-radius: 9999px;
          transition: all 0.3s;
          background: #10b981;
        }

        .progress-fill.warning {
          background: #f97316;
        }

        /* Location Preview */
        .location-preview {
          margin-top: 1.5rem;
          padding: 1rem;
          background: linear-gradient(45deg, #ecfdf5, #d1fae5);
          border: 2px solid #6ee7b7;
          border-radius: 1rem;
        }

        .location-content {
          display: flex;
          align-items: center;
        }

        .location-preview-icon {
          width: 2.5rem;
          height: 2.5rem;
          background: #10b981;
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 1rem;
        }

        .location-info h4 {
          font-weight: bold;
          color: #065f46;
          margin: 0 0 0.25rem 0;
        }

        .location-info p {
          font-size: 0.875rem;
          color: #059669;
          margin: 0;
        }

        /* Shop Images Section */
        .images-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        @media (min-width: 640px) {
          .images-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .images-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .image-item {
          position: relative;
        }

        .image-container {
          aspect-ratio: 1;
          background: #f3f4f6;
          border-radius: 1rem;
          overflow: hidden;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .image-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }

        .image-item:hover .image-container img {
          transform: scale(1.05);
        }

        .main-badge {
          position: absolute;
          top: 0.5rem;
          left: 0.5rem;
          background: linear-gradient(45deg, #10b981, #059669);
          color: white;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-weight: bold;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .action-buttons {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          display: flex;
          gap: 0.25rem;
          opacity: 0;
          transition: opacity 0.3s;
        }

        .image-item:hover .action-buttons {
          opacity: 1;
        }

        .action-btn {
          width: 2rem;
          height: 2rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          border: none;
          cursor: pointer;
        }

        .btn-star {
          background: #3b82f6;
          color: white;
        }

        .btn-star:hover {
          background: #2563eb;
        }

        .btn-remove {
          background: #ef4444;
          color: white;
        }

        .btn-remove:hover {
          background: #dc2626;
        }

        .upload-area {
          border: 2px dashed #8b5cf6;
          border-radius: 1rem;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .upload-area:hover {
          border-color: #7c3aed;
          background: rgba(139, 92, 246, 0.05);
        }

        .upload-icon {
          margin: 0 auto 1rem auto;
          width: 4rem;
          height: 4rem;
          color: #8b5cf6;
        }

        .upload-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .upload-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .upload-loading {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spinner-small {
          animation: spin 1s linear infinite;
          border-radius: 50%;
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid transparent;
          border-top: 2px solid #8b5cf6;
          margin-right: 0.5rem;
        }

        .tip {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.75rem;
        }

        .tip strong {
          color: #374151;
        }

        .hidden {
          display: none;
        }

        /* Submit Section */
        .submit-section {
          display: flex;
          justify-content: flex-end;
          gap: 1.5rem;
          padding-top: 2rem;
        }

        @media (max-width: 640px) {
          .submit-section {
            flex-direction: column;
          }
        }

        .btn {
          padding: 1rem 2rem;
          border-radius: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          border: none;
          font-size: 1rem;
        }

        .btn-secondary {
          border: 2px solid #d1d5db;
          color: #374151;
          background: white;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        .btn-primary {
          background: linear-gradient(45deg, #6366f1, #8b5cf6);
          color: white;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .btn-primary:hover {
          background: linear-gradient(45deg, #4f46e5, #7c3aed);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .btn-primary:focus {
          outline: none;
          ring: 2px;
          ring-offset: 2px;
          ring-color: #6366f1;
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn:disabled:hover {
          background: linear-gradient(45deg, #6366f1, #8b5cf6);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .btn-icon {
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 0.5rem;
        }

        /* Error Page */
        .error-container {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.5);
          padding: 3rem;
          text-align: center;
        }

        .error-icon {
          width: 6rem;
          height: 6rem;
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem auto;
        }

        .error-title {
          font-size: 1.5rem;
          font-weight: bold;
          color: #374151;
          margin: 0 0 1rem 0;
        }

        .error-text {
          color: #6b7280;
          margin: 0 0 1.5rem 0;
        }

        .try-again-btn {
          background: linear-gradient(45deg, #f97316, #f59e0b);
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 0.75rem;
          font-weight: 600;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }

        .try-again-btn:hover {
          background: linear-gradient(45deg, #ea580c, #d97706);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        @media (max-width: 768px) {
          .main-wrapper {
            padding: 1rem;
          }
          
          .header-content {
            padding: 1.5rem;
          }
          
          .section-content {
            padding: 1.5rem;
          }
          
          .grid {
            gap: 1rem;
          }
          
          .images-grid {
            grid-template-columns: repeat(2, 1fr);
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="header-title">Profile Settings</h1>
                    <p className="header-subtitle">Manage your personal and business information</p>
                  </div>
                </div>
                
                {selectedPlace && selectedPlace.coordinates && (
                  <div className="location-badge">
                    <svg className="location-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="location-text">Location Saved</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        
          {fetchLoading ? (
            <div className="loading-container">
              <div className="spinner-container">
                <div className="spinner">
                  <div className="spinner-outer"></div>
                  <div className="spinner-inner"></div>
                </div>
                <span className="loading-text">Loading your profile...</span>
              </div>
            </div>
          ) : profile ? (
            <Formik
              initialValues={{
                firstName: profile.firstName || '',
                email: profile.email || '',
                mobileNumber: profile.mobileNumber || '',
                shop: {
                  name: profile.shop?.name || '',
                  address: profile.shop?.address || '',
                  gstNumber: profile.shop?.gstNumber || '',
                  phoneNumber: {
                    main: profile.shop?.phoneNumber?.main || '',
                    alternate: profile.shop?.phoneNumber?.alternate || ''
                  },
                  category: profile.shop?.category || '',
                  openTime: profile.shop?.openTime || '',
                  closeTime: profile.shop?.closeTime || '',
                  workingDays: profile.shop?.workingDays || '',
                  description: profile.shop?.description || '',
                  images: profile.shop?.images || [],
                  mainImage: profile.shop?.mainImage || ''
                },
                bankDetails: {
                  accountNumber: profile.bankDetails?.accountNumber || '',
                  ifscCode: profile.bankDetails?.ifscCode || '',
                  bankName: profile.bankDetails?.bankName || '',
                  accountType: profile.bankDetails?.accountType || ''
                }
              }}
              validationSchema={ProfileSchema}
              onSubmit={handleSubmit}
            >
              {({ values, setFieldValue, isSubmitting, errors, touched }) => (
                <Form className="form-container">
                  
                  {/* Personal Information */}
                  <div className="section section-blue">
                    <div className="section-content">
                      <div className="section-header">
                        <div className="section-icon icon-blue">
                          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h2 className="section-title">Personal Information</h2>
                      </div>
                      
                      <div className="grid lg:grid-cols-3">
                        <div className="form-group">
                          <label htmlFor="firstName" className="form-label">
                            First Name*
                          </label>
                          <Field
                            id="firstName"
                            name="firstName"
                            type="text"
                            className="form-input"
                            placeholder="Your first name"
                          />
                          <ErrorMessage
                            name="firstName"
                            component="div"
                            className="error-message"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="email" className="form-label">
                            Email Address*
                          </label>
                          <Field
                            id="email"
                            name="email"
                            type="email"
                            className="form-input"
                            placeholder="your@email.com"
                          />
                          <ErrorMessage
                            name="email"
                            component="div"
                            className="error-message"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="mobileNumber" className="form-label">
                            Mobile Number*
                          </label>
                          <Field
                            id="mobileNumber"
                            name="mobileNumber"
                            type="text"
                            className="form-input"
                            placeholder="+91 XXXXX XXXXX"
                          />
                          <ErrorMessage
                            name="mobileNumber"
                            component="div"
                            className="error-message"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Shop Information */}
                  <div className="section section-orange">
                    <div className="section-content">
                      <div className="section-header">
                        <div className="section-icon icon-orange">
                          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <h2 className="section-title">Shop Information</h2>
                      </div>
                      
                      <div className="grid lg:grid-cols-2">
                        <div className="form-group">
                          <label htmlFor="shop.name" className="form-label">
                            Shop Name*
                          </label>
                          <Field
                            id="shop.name"
                            name="shop.name"
                            type="text"
                            className="form-input"
                            placeholder="Your shop name"
                          />
                          <ErrorMessage
                            name="shop.name"
                            component="div"
                            className="error-message"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="shop.address" className="form-label">
                            Shop Address*
                          </label>
                          <GooglePlacesAutocomplete
                            value={values.shop.address}
                            onChange={(address) => setFieldValue('shop.address', address)}
                            onPlaceSelected={handlePlaceSelected}
                            placeholder="Enter your shop address"
                            className="form-input"
                            error={errors.shop?.address && touched.shop?.address ? errors.shop.address : null}
                          />
                          <ErrorMessage
                            name="shop.address"
                            component="div"
                            className="error-message"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="shop.gstNumber" className="form-label">
                            GST Number <span style={{ color: '#6b7280' }}>(Optional)</span>
                          </label>
                          <Field
                            id="shop.gstNumber"
                            name="shop.gstNumber"
                            type="text"
                            className="form-input"
                            placeholder="GST Registration Number"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="shop.category" className="form-label">
                            Shop Category*
                          </label>
                          <Field
                            as="select"
                            id="shop.category"
                            name="shop.category"
                            className="form-select"
                          >
                            <option value="">Select a category</option>
                            <option value="Men">Men's Fashion</option>
                            <option value="Women">Women's Fashion</option>
                            <option value="Kids">Kids Fashion</option>
                          </Field>
                          <ErrorMessage
                            name="shop.category"
                            component="div"
                            className="error-message"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="shop.phoneNumber.main" className="form-label">
                            Shop Phone Number
                          </label>
                          <Field
                            id="shop.phoneNumber.main"
                            name="shop.phoneNumber.main"
                            type="text"
                            className="form-input"
                            placeholder="Shop contact number"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="shop.phoneNumber.alternate" className="form-label">
                            Alternate Phone <span style={{ color: '#6b7280' }}>(Optional)</span>
                          </label>
                          <Field
                            id="shop.phoneNumber.alternate"
                            name="shop.phoneNumber.alternate"
                            type="text"
                            className="form-input"
                            placeholder="Alternative contact number"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="shop.openTime" className="form-label">
                            Opening Time
                          </label>
                          <Field
                            id="shop.openTime"
                            name="shop.openTime"
                            type="text"
                            placeholder="e.g. 9:00 AM"
                            className="form-input"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="shop.closeTime" className="form-label">
                            Closing Time
                          </label>
                          <Field
                            id="shop.closeTime"
                            name="shop.closeTime"
                            type="text"
                            placeholder="e.g. 8:00 PM"
                            className="form-input"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="shop.workingDays" className="form-label">
                            Working Days
                          </label>
                          <Field
                            id="shop.workingDays"
                            name="shop.workingDays"
                            type="text"
                            placeholder="e.g. Monday to Saturday"
                            className="form-input"
                          />
                        </div>
                      </div>

                      {/* Shop Description */}
                      <div className="form-group" style={{ marginTop: '2rem' }}>
                        <label htmlFor="shop.description" className="form-label">
                          Shop Description <span style={{ color: '#6b7280' }}>(Optional)</span>
                        </label>
                        <Field
                          as="textarea"
                          id="shop.description"
                          name="shop.description"
                          className="form-input form-textarea"
                          placeholder="Tell customers about your shop, what you sell, and what makes you special..."
                        />
                        <ErrorMessage
                          name="shop.description"
                          component="div"
                          className="error-message"
                        />
                        <div className="char-counter">
                          <div className={`char-count ${values.shop.description.length > 400 ? 'warning' : ''}`}>
                            {values.shop.description.length}/500 characters
                          </div>
                          <div className="progress-bar">
                            <div 
                              className={`progress-fill ${values.shop.description.length > 400 ? 'warning' : ''}`}
                              style={{ width: `${(values.shop.description.length / 500) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {/* Location Preview */}
                      {selectedPlace && selectedPlace.coordinates && (
                        <div className="location-preview">
                          <div className="location-content">
                            <div className="location-preview-icon">
                              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                            </div>
                            <div className="location-info">
                              <h4>Location Coordinates Captured</h4>
                              <p>
                                Lat: {selectedPlace.coordinates[1].toFixed(6)}, 
                                Lng: {selectedPlace.coordinates[0].toFixed(6)}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Shop Images Section */}
                  <div className="section section-purple">
                    <div className="section-content">
                      <div className="section-header">
                        <div className="section-icon icon-purple">
                          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <h2 className="section-title">Shop Gallery</h2>
                      </div>
                      
                      <div>
                        <label className="form-label">
                          Upload Shop Images
                        </label>
                        
                        {values.shop.images.length > 0 && (
                          <div className="images-grid">
                            {values.shop.images.map((image, index) => (
                              <div key={index} className="image-item">
                                <div className="image-container">
                                  <img 
                                    src={image} 
                                    alt={`Shop ${index + 1}`}
                                  />
                                </div>
                                
                                {/* Main Image Badge */}
                                {values.shop.mainImage === image && (
                                  <div className="main-badge">
                                    ⭐ Main
                                  </div>
                                )}
                                
                                {/* Action Buttons */}
                                <div className="action-buttons">
                                  {values.shop.mainImage !== image && (
                                    <button
                                      type="button"
                                      onClick={() => setMainImage(image, setFieldValue)}
                                      className="action-btn btn-star"
                                      title="Set as main image"
                                    >
                                      <span style={{ fontSize: '0.75rem' }}>★</span>
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeShopImage(index, setFieldValue, values.shop.images)}
                                    className="action-btn btn-remove"
                                    title="Remove image"
                                  >
                                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="upload-area">
                          <label style={{ display: 'block', cursor: 'pointer' }}>
                            <div>
                              <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                              <div className="upload-title">
                                {uploadingImages ? 'Uploading Shop Images...' : 'Upload Shop Images'}
                              </div>
                              <div className="upload-subtitle">
                                {uploadingImages ? (
                                  <div className="upload-loading">
                                    <div className="spinner-small"></div>
                                    Processing your images...
                                  </div>
                                ) : (
                                  'Showcase your shop with beautiful photos'
                                )}
                              </div>
                            </div>
                            <input 
                              type="file" 
                              multiple
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => handleShopImageUpload(e, setFieldValue, values.shop.images)}
                              disabled={uploadingImages}
                            />
                          </label>
                        </div>
                        
                        <p className="tip">
                          💡 <strong>Tip:</strong> Upload high-quality images that represent your shop. The first image or the one you mark as "main" will be featured prominently.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bank Information */}
                  <div className="section section-green">
                    <div className="section-content">
                      <div className="section-header">
                        <div className="section-icon icon-green">
                          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <h2 className="section-title">Banking Information</h2>
                      </div>
                      
                      <div className="grid lg:grid-cols-2">
                        <div className="form-group">
                          <label htmlFor="bankDetails.bankName" className="form-label">
                            Bank Name
                          </label>
                          <Field
                            id="bankDetails.bankName"
                            name="bankDetails.bankName"
                            type="text"
                            className="form-input"
                            placeholder="Bank name"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="bankDetails.accountNumber" className="form-label">
                            Account Number
                          </label>
                          <Field
                            id="bankDetails.accountNumber"
                            name="bankDetails.accountNumber"
                            type="text"
                            className="form-input"
                            placeholder="Account number"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="bankDetails.ifscCode" className="form-label">
                            IFSC Code
                          </label>
                          <Field
                            id="bankDetails.ifscCode"
                            name="bankDetails.ifscCode"
                            type="text"
                            className="form-input"
                            placeholder="IFSC code"
                          />
                        </div>
                        
                        <div className="form-group">
                          <label htmlFor="bankDetails.accountType" className="form-label">
                            Account Type
                          </label>
                          <Field
                            as="select"
                            id="bankDetails.accountType"
                            name="bankDetails.accountType"
                            className="form-select"
                          >
                            <option value="">Select account type</option>
                            <option value="Savings">Savings Account</option>
                            <option value="Current">Current Account</option>
                          </Field>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Section */}
                  <div className="submit-section">
                    <button
                      type="button"
                      onClick={() => window.history.back()}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isLoading || uploadingImages}
                      className="btn btn-primary"
                    >
                      {isLoading ? (
                        <>
                          <div className="spinner-small"></div>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          ) : (
            <div className="error-container">
              <div className="error-icon">
                <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: '#ef4444' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="error-title">Unable to Load Profile</h3>
              <p className="error-text">We couldn't fetch your profile data. Please try again.</p>
              <button
                onClick={fetchSellerProfile}
                className="try-again-btn"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </SellerLayout>
  );
};

export default EditProfile;