import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import SellerLayout from '../../components/layouts/SellerLayout';
import { createProduct } from '../../services/productService';

// 🎯 FIXED: Categories EXACTLY matching backend Product.js schema
const productCategories = {
  Men: {
    subCategories: [
      'T-shirts', 'Shirts', 'Jeans', 'Ethnic Wear', 'Jackets', 
      'Tops', 'Tees', 'Sleepwear', 'Top Wear'
    ]
  },
  Women: {
    subCategories: [
      'Kurties', 'Tops', 'Tees', 'Dresses', 'Jeans', 'Nightwear', 
      'Sleepwear', 'Lehengass', 'Rayon', 'Shrugs'
    ]
  },
  Kids: {
    subCategories: [
      'T-shirts', 'Shirts', 'Boys Sets', 'Top Wear', 'Nightwear', 'Sleepwear'
    ]
  }
};

// 🎯 FIXED: Product categories exactly matching backend enum
const productCategoryOptions = [
  { value: '', label: 'Select Product Category' },
  { value: 'Traditional Indian', label: 'Traditional Indian' },
  { value: 'Winter Fashion', label: 'Winter Fashion' },
  { value: 'Party Wear', label: 'Party Wear' },
  { value: 'Sports Destination', label: 'Sports Destination' },
  { value: 'Office Wear', label: 'Office Wear' }
];

// Size options aligned with backend enum
const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];

// Common color options with hex codes
const colorOptions = [
  { name: 'Black', code: '#000000' },
  { name: 'White', code: '#FFFFFF' },
  { name: 'Red', code: '#FF0000' },
  { name: 'Blue', code: '#0000FF' },
  { name: 'Green', code: '#008000' },
  { name: 'Yellow', code: '#FFFF00' },
  { name: 'Purple', code: '#800080' },
  { name: 'Orange', code: '#FFA500' },
  { name: 'Pink', code: '#FFC0CB' },
  { name: 'Brown', code: '#964B00' },
  { name: 'Gray', code: '#808080' },
  { name: 'Navy', code: '#000080' },
  { name: 'Maroon', code: '#800000' },
  { name: 'Olive', code: '#808000' },
  { name: 'Cyan', code: '#00FFFF' },
  { name: 'Magenta', code: '#FF00FF' }
];

// Validation schema aligned with backend
const productSchema = Yup.object().shape({
  name: Yup.string()
    .required('Product name is required')
    .max(100, 'Name cannot be more than 100 characters'),
  description: Yup.string()
    .required('Description is required')
    .max(1000, 'Description cannot be more than 1000 characters'),
  category: Yup.string().required('Category is required'),
  subCategory: Yup.string().required('Sub-category is required'),
  productCategory: Yup.string().required('Product category is required'),
  zammerPrice: Yup.number()
    .required('Zammer price is required')
    .positive('Price must be positive'),
  mrp: Yup.number()
    .required('MRP is required')
    .positive('MRP must be positive')
    .test('mrp-greater', 'MRP should be greater than or equal to Zammer price', function(value) {
      const { zammerPrice } = this.parent;
      return !zammerPrice || !value || value >= zammerPrice;
    }),
  variants: Yup.array().of(
    Yup.object().shape({
      color: Yup.string().required('Color is required'),
      colorCode: Yup.string().required('Color code is required'),
      size: Yup.string().required('Size is required'),
      quantity: Yup.number()
        .required('Quantity is required')
        .min(0, 'Quantity must be at least 0')
    })
  ).min(1, 'At least one variant is required'),
  images: Yup.array().min(1, 'At least one image is required')
});

// 🎯 IMPROVED: Better mock image upload with base64 fallback
const mockImageUpload = async (file) => {
  try {
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 🎯 FIXED: Create base64 data URL for reliable image display
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target.result); // Returns base64 data URL
      };
      reader.onerror = (error) => {
        console.error('File reading error:', error);
        // Fallback to a placeholder
        resolve('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmMGYwZjAiLz4KPHRleHQgeD0iMTUwIiB5PSIxNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+UHJvZHVjdCBJbWFnZTwvdGV4dD4KPC9zdmc+');
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('Image upload error:', error);
    // Return placeholder SVG
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNmMGYwZjAiLz4KPHRleHQgeD0iMTUwIiB5PSIxNTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5OTkiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNiI+UHJvZHVjdCBJbWFnZTwvdGV4dD4KPC9zdmc+';
  }
};

const AddProduct = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const navigate = useNavigate();

  const handleImageUpload = async (e, setFieldValue, images) => {
    setUploadingImages(true);
    try {
      const files = Array.from(e.target.files);
      const uploadedImages = [...images];
      
      for (const file of files) {
        const imageUrl = await mockImageUpload(file);
        uploadedImages.push(imageUrl);
      }
      
      setFieldValue('images', uploadedImages);
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error) {
      toast.error('Failed to upload images');
      console.error('Image upload error:', error);
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsLoading(true);
    try {
      // Transform data to match backend schema exactly
      const productData = {
        ...values,
        // Ensure variants match backend VariantSchema exactly
        variants: values.variants.map(variant => ({
          color: variant.color,
          colorCode: variant.colorCode,
          size: variant.size,
          quantity: Number(variant.quantity), // Ensure it's a number
          images: [] // Variant-specific images can be added later
        }))
      };

      console.log('Submitting product data:', productData);
      
      const response = await createProduct(productData);
      
      if (response.success) {
        toast.success('Product added successfully!');
        resetForm();
        navigate('/seller/view-products');
      } else {
        toast.error(response.message || 'Failed to add product');
      }
    } catch (error) {
      console.error('Product creation error:', error);
      
      // Enhanced error message handling
      if (error.message && error.message.includes('validation failed')) {
        const errorDetails = error.message.split(':').slice(1).join(':').trim();
        toast.error(`Validation Error: ${errorDetails}`);
      } else if (error.message && error.message.includes('enum')) {
        toast.error('Please select from the available dropdown options only');
      } else {
        toast.error(error.message || 'Something went wrong while adding the product');
      }
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
          max-width: 1200px;
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
          background: linear-gradient(45deg, #ea580c, #f97316, #f59e0b);
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
          gap: 1rem;
        }

        .header-icon {
          width: 4rem;
          height: 4rem;
          background: linear-gradient(135deg, #f97316, #f59e0b);
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .header-title {
          font-size: 2.5rem;
          font-weight: bold;
          background: linear-gradient(45deg, #111827, #374151, #ea580c);
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
          background: linear-gradient(45deg, #f97316, #f59e0b);
          filter: blur(8px);
          opacity: 0.2;
          transition: opacity 0.3s;
        }

        .section:hover::before {
          opacity: 0.3;
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

        .section-number {
          width: 2.5rem;
          height: 2.5rem;
          background: linear-gradient(135deg, #f97316, #f59e0b);
          border-radius: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          margin-right: 1rem;
          color: white;
          font-size: 1.125rem;
          font-weight: bold;
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

        .grid-cols-4 {
          grid-template-columns: repeat(4, 1fr);
        }

        @media (min-width: 1024px) {
          .lg\\:grid-cols-2 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 768px) {
          .md\\:grid-cols-2 {
            grid-template-columns: repeat(2, 1fr);
          }
          .md\\:grid-cols-4 {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .col-span-2 {
          grid-column: span 2;
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
        }

        .form-input:focus {
          outline: none;
          ring: 2px;
          ring-color: #f97316;
          border-color: transparent;
        }

        .form-input:disabled {
          opacity: 0.5;
        }

        .form-textarea {
          resize: none;
          min-height: 120px;
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
        }

        .form-select:focus {
          outline: none;
          ring: 2px;
          ring-color: #f97316;
          border-color: transparent;
        }

        .error-message {
          color: #ef4444;
          font-size: 0.875rem;
          margin-top: 0.5rem;
          font-weight: 500;
        }

        .help-text {
          font-size: 0.875rem;
          color: #6b7280;
          margin-top: 0.5rem;
          font-style: italic;
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
          color: #ea580c;
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

        /* Pricing Section */
        .pricing-section .section::before {
          background: linear-gradient(45deg, #10b981, #059669);
        }

        .pricing-section .section-number {
          background: linear-gradient(135deg, #10b981, #059669);
        }

        .input-group {
          position: relative;
        }

        .input-prefix {
          position: absolute;
          left: 1rem;
          top: 50%;
          transform: translateY(-50%);
          color: #6b7280;
          font-size: 1.125rem;
          pointer-events: none;
        }

        .input-with-prefix {
          padding-left: 2.5rem;
        }

        .discount-card {
          margin-top: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(45deg, #ecfdf5, #d1fae5);
          border: 2px solid #10b981;
          border-radius: 1rem;
        }

        .discount-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .discount-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .discount-icon {
          width: 3rem;
          height: 3rem;
          background: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .discount-info h4 {
          color: #065f46;
          font-size: 1.125rem;
          font-weight: bold;
          margin: 0;
        }

        .discount-info p {
          color: #059669;
          font-size: 0.875rem;
          margin: 0;
        }

        .discount-right {
          text-align: right;
        }

        .discount-price {
          font-size: 1.5rem;
          font-weight: bold;
          color: #065f46;
        }

        .discount-original {
          font-size: 0.875rem;
          color: #6b7280;
          text-decoration: line-through;
        }

        /* Variants Section */
        .variants-section .section::before {
          background: linear-gradient(45deg, #8b5cf6, #ec4899);
        }

        .variants-section .section-number {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
        }

        .variants-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .variant-item {
          position: relative;
          padding: 1.5rem;
          background: linear-gradient(135deg, #f9fafb, #ffffff);
          border: 2px solid #e5e7eb;
          border-radius: 1rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .variant-label {
          position: absolute;
          top: -0.75rem;
          left: 1.5rem;
          background: #8b5cf6;
          color: white;
          padding: 0.25rem 1rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
        }

        .variant-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          margin-top: 1rem;
        }

        @media (min-width: 768px) {
          .variant-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1024px) {
          .variant-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        .color-preview {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .color-swatch {
          width: 3rem;
          height: 3rem;
          border: 2px solid #d1d5db;
          border-radius: 0.75rem;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .color-input {
          flex: 1;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          border: 2px solid #e5e7eb;
          border-radius: 0.5rem;
          transition: all 0.2s;
        }

        .color-input:focus {
          outline: none;
          ring: 2px;
          ring-color: #8b5cf6;
          border-color: transparent;
        }

        .remove-btn {
          position: absolute;
          top: -0.75rem;
          right: -0.75rem;
          width: 2rem;
          height: 2rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.2s;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .remove-btn:hover {
          background: #dc2626;
        }

        .add-variant-btn {
          width: 100%;
          padding: 1rem;
          border: 2px dashed #8b5cf6;
          border-radius: 1rem;
          color: #8b5cf6;
          background: transparent;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .add-variant-btn:hover {
          color: #7c3aed;
          border-color: #7c3aed;
          background: #f3f4f6;
        }

        /* Images Section */
        .images-section .section::before {
          background: linear-gradient(45deg, #3b82f6, #06b6d4);
        }

        .images-section .section-number {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
        }

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

        .image-remove-btn {
          position: absolute;
          top: -0.75rem;
          right: -0.75rem;
          width: 2rem;
          height: 2rem;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
          opacity: 0;
        }

        .image-item:hover .image-remove-btn {
          opacity: 1;
        }

        .image-remove-btn:hover {
          background: #dc2626;
        }

        .main-badge {
          position: absolute;
          bottom: 0.5rem;
          left: 0.5rem;
          background: #10b981;
          color: white;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-weight: 500;
        }

        .upload-area {
          border: 2px dashed #3b82f6;
          border-radius: 1rem;
          padding: 2rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .upload-area:hover {
          border-color: #2563eb;
          background: rgba(59, 130, 246, 0.05);
        }

        .upload-content {
          text-align: center;
        }

        .upload-icon {
          margin: 0 auto 1rem auto;
          width: 4rem;
          height: 4rem;
          color: #3b82f6;
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

        .spinner {
          animation: spin 1s linear infinite;
          border-radius: 50%;
          width: 1.25rem;
          height: 1.25rem;
          border: 2px solid transparent;
          border-top: 2px solid #3b82f6;
          margin-right: 0.5rem;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .hidden {
          display: none;
        }

        /* Features Section */
        .features-section .section::before {
          background: linear-gradient(45deg, #6366f1, #8b5cf6);
        }

        .features-section .section-number {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
        }

        .features-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        .checkbox-card {
          display: flex;
          align-items: center;
          padding: 1rem;
          background: linear-gradient(45deg, #f3f4f6, #e5e7eb);
          border-radius: 0.75rem;
          border: 1px solid #d1d5db;
        }

        .checkbox-card.purple {
          background: linear-gradient(45deg, #faf5ff, #f3e8ff);
          border-color: #8b5cf6;
        }

        .checkbox-card.pink {
          background: linear-gradient(45deg, #fdf2f8, #fce7f3);
          border-color: #ec4899;
        }

        .checkbox-input {
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 1rem;
          accent-color: #8b5cf6;
        }

        .checkbox-label {
          color: #374151;
          font-weight: 500;
        }

        .tags-input {
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
        }

        .tags-input:focus {
          outline: none;
          ring: 2px;
          ring-color: #6366f1;
          border-color: transparent;
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
          background: linear-gradient(45deg, #f97316, #f59e0b);
          color: white;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .btn-primary:hover {
          background: linear-gradient(45deg, #ea580c, #d97706);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }

        .btn-primary:focus {
          outline: none;
          ring: 2px;
          ring-offset: 2px;
          ring-color: #f97316;
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn:disabled:hover {
          background: linear-gradient(45deg, #f97316, #f59e0b);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .btn-icon {
          width: 1.25rem;
          height: 1.25rem;
          margin-right: 0.5rem;
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
          
          .variant-grid {
            grid-template-columns: 1fr;
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
                <div className="header-icon">
                  <svg width="32" height="32" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h1 className="header-title">Create New Product</h1>
                  <p className="header-subtitle">Build your next bestseller with our premium product creator</p>
                </div>
              </div>
            </div>
          </div>
        
          <Formik
            initialValues={{
              name: '',
              description: '',
              category: '',
              subCategory: '',
              productCategory: '',
              zammerPrice: '',
              mrp: '',
              variants: [{ color: '', colorCode: '', size: '', quantity: 1 }],
              images: [],
              tags: [],
              isLimitedEdition: false,
              isTrending: false
            }}
            validationSchema={productSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue, isSubmitting, errors, touched }) => (
              <Form className="form-container">
                {/* Basic Information Section */}
                <div className="section">
                  <div className="section-content">
                    <div className="section-header">
                      <div className="section-number">1</div>
                      <h2 className="section-title">Basic Information</h2>
                    </div>
                    
                    <div className="grid lg:grid-cols-2">
                      {/* Product Name */}
                      <div className="col-span-2 form-group">
                        <label htmlFor="name" className="form-label">Product Name*</label>
                        <Field
                          id="name"
                          name="name"
                          type="text"
                          className="form-input"
                          placeholder="Enter your amazing product name..."
                        />
                        <ErrorMessage name="name" component="div" className="error-message" />
                      </div>
                      
                      {/* Category */}
                      <div className="form-group">
                        <label htmlFor="category" className="form-label">Category*</label>
                        <Field
                          as="select"
                          id="category"
                          name="category"
                          className="form-select"
                          onChange={(e) => {
                            const category = e.target.value;
                            setFieldValue('category', category);
                            setFieldValue('subCategory', '');
                          }}
                        >
                          <option value="">Select Category</option>
                          {Object.keys(productCategories).map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage name="category" component="div" className="error-message" />
                      </div>
                      
                      {/* Sub Category */}
                      <div className="form-group">
                        <label htmlFor="subCategory" className="form-label">Sub Category*</label>
                        <Field
                          as="select"
                          id="subCategory"
                          name="subCategory"
                          className="form-select"
                          disabled={!values.category}
                        >
                          <option value="">Select Sub Category</option>
                          {values.category && 
                            productCategories[values.category].subCategories.map((subCategory) => (
                              <option key={subCategory} value={subCategory}>
                                {subCategory}
                              </option>
                            ))
                          }
                        </Field>
                        <ErrorMessage name="subCategory" component="div" className="error-message" />
                        {!values.category && (
                          <p className="help-text">Please select a category first</p>
                        )}
                      </div>
                      
                      {/* Product Category */}
                      <div className="col-span-2 form-group">
                        <label htmlFor="productCategory" className="form-label">Product Category*</label>
                        <Field
                          as="select"
                          id="productCategory"
                          name="productCategory"
                          className="form-select"
                        >
                          {productCategoryOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </Field>
                        <ErrorMessage name="productCategory" component="div" className="error-message" />
                      </div>
                    </div>
                    
                    {/* Description */}
                    <div className="form-group" style={{ marginTop: '2rem' }}>
                      <label htmlFor="description" className="form-label">Product Description*</label>
                      <Field
                        as="textarea"
                        id="description"
                        name="description"
                        className="form-input form-textarea"
                        placeholder="Describe your product in detail... What makes it special?"
                      />
                      <ErrorMessage name="description" component="div" className="error-message" />
                      <div className="char-counter">
                        <div className={`char-count ${values.description.length > 800 ? 'warning' : ''}`}>
                          {values.description.length}/1000 characters
                        </div>
                        <div className="progress-bar">
                          <div 
                            className={`progress-fill ${values.description.length > 800 ? 'warning' : ''}`}
                            style={{ width: `${(values.description.length / 1000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pricing Section */}
                <div className="pricing-section section">
                  <div className="section-content">
                    <div className="section-header">
                      <div className="section-number">2</div>
                      <h2 className="section-title">Pricing Strategy</h2>
                    </div>
                    
                    <div className="grid lg:grid-cols-2">
                      <div className="form-group">
                        <label htmlFor="zammerPrice" className="form-label">Zammer Price (₹)*</label>
                        <div className="input-group">
                          <div className="input-prefix">₹</div>
                          <Field
                            id="zammerPrice"
                            name="zammerPrice"
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-input input-with-prefix"
                            placeholder="0.00"
                          />
                        </div>
                        <ErrorMessage name="zammerPrice" component="div" className="error-message" />
                        <p className="help-text">Your selling price on Zammer</p>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="mrp" className="form-label">MRP (₹)*</label>
                        <div className="input-group">
                          <div className="input-prefix">₹</div>
                          <Field
                            id="mrp"
                            name="mrp"
                            type="number"
                            min="0"
                            step="0.01"
                            className="form-input input-with-prefix"
                            placeholder="0.00"
                          />
                        </div>
                        <ErrorMessage name="mrp" component="div" className="error-message" />
                        <p className="help-text">Maximum retail price</p>
                      </div>
                    </div>
                    
                    {/* Discount Calculation */}
                    {values.zammerPrice && values.mrp && Number(values.mrp) > Number(values.zammerPrice) && (
                      <div className="discount-card">
                        <div className="discount-content">
                          <div className="discount-left">
                            <div className="discount-icon">
                              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                              </svg>
                            </div>
                            <div className="discount-info">
                              <h4>{Math.round(((Number(values.mrp) - Number(values.zammerPrice)) / Number(values.mrp)) * 100)}% Discount</h4>
                              <p>Customer saves ₹{(Number(values.mrp) - Number(values.zammerPrice)).toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="discount-right">
                            <div className="discount-price">₹{values.zammerPrice}</div>
                            <div className="discount-original">₹{values.mrp}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Variants Section */}
                <div className="variants-section section">
                  <div className="section-content">
                    <div className="section-header">
                      <div className="section-number">3</div>
                      <h2 className="section-title">Product Variants</h2>
                    </div>
                    
                    <FieldArray name="variants">
                      {({ remove, push }) => (
                        <div className="variants-container">
                          {values.variants.map((variant, index) => (
                            <div key={index} className="variant-item">
                              <div className="variant-label">Variant {index + 1}</div>
                              
                              <div className="variant-grid">
                                {/* Color Selection */}
                                <div className="form-group">
                                  <label className="form-label">Color*</label>
                                  <Field
                                    as="select"
                                    name={`variants.${index}.color`}
                                    className="form-select"
                                    onChange={(e) => {
                                      const selectedColor = colorOptions.find(color => color.name === e.target.value);
                                      setFieldValue(`variants.${index}.color`, e.target.value);
                                      if (selectedColor) {
                                        setFieldValue(`variants.${index}.colorCode`, selectedColor.code);
                                      }
                                    }}
                                  >
                                    <option value="">Select Color</option>
                                    {colorOptions.map((color) => (
                                      <option key={color.name} value={color.name}>
                                        {color.name}
                                      </option>
                                    ))}
                                  </Field>
                                  <ErrorMessage name={`variants.${index}.color`} component="div" className="error-message" />
                                </div>

                                {/* Color Preview */}
                                <div className="form-group">
                                  <label className="form-label">Preview</label>
                                  <div className="color-preview">
                                    <div 
                                      className="color-swatch"
                                      style={{ backgroundColor: variant.colorCode || '#f0f0f0' }}
                                    ></div>
                                    <Field
                                      name={`variants.${index}.colorCode`}
                                      type="text"
                                      placeholder="#000000"
                                      className="color-input"
                                    />
                                  </div>
                                  <ErrorMessage name={`variants.${index}.colorCode`} component="div" className="error-message" />
                                </div>
                                
                                {/* Size Selection */}
                                <div className="form-group">
                                  <label className="form-label">Size*</label>
                                  <Field
                                    as="select"
                                    name={`variants.${index}.size`}
                                    className="form-select"
                                  >
                                    <option value="">Select Size</option>
                                    {sizeOptions.map((size) => (
                                      <option key={size} value={size}>
                                        {size}
                                      </option>
                                    ))}
                                  </Field>
                                  <ErrorMessage name={`variants.${index}.size`} component="div" className="error-message" />
                                </div>
                                
                                {/* Quantity */}
                                <div className="form-group">
                                  <label className="form-label">Quantity*</label>
                                  <Field
                                    name={`variants.${index}.quantity`}
                                    type="number"
                                    min="0"
                                    className="form-input"
                                  />
                                  <ErrorMessage name={`variants.${index}.quantity`} component="div" className="error-message" />
                                </div>
                              </div>
                              
                              {/* Remove Button */}
                              {index > 0 && (
                                <button
                                  type="button"
                                  onClick={() => remove(index)}
                                  className="remove-btn"
                                >
                                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                          
                          <button
                            type="button"
                            onClick={() => push({ color: '', colorCode: '', size: '', quantity: 1 })}
                            className="add-variant-btn"
                          >
                            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ margin: '0 auto 0.5rem auto' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Another Variant
                          </button>
                        </div>
                      )}
                    </FieldArray>
                  </div>
                </div>

                {/* Images Section */}
                <div className="images-section section">
                  <div className="section-content">
                    <div className="section-header">
                      <div className="section-number">4</div>
                      <h2 className="section-title">Product Gallery</h2>
                    </div>
                    
                    <div>
                      <label className="form-label">Upload Product Images*</label>
                      
                      {values.images.length > 0 && (
                        <div className="images-grid">
                          {values.images.map((image, index) => (
                            <div key={index} className="image-item">
                              <div className="image-container">
                                <img 
                                  src={image} 
                                  alt={`Product ${index + 1}`}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const newImages = [...values.images];
                                  newImages.splice(index, 1);
                                  setFieldValue('images', newImages);
                                }}
                                className="image-remove-btn"
                              >
                                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                              {index === 0 && (
                                <div className="main-badge">Main</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className="upload-area">
                        <label style={{ display: 'block', cursor: 'pointer' }}>
                          <div className="upload-content">
                            <svg className="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <div className="upload-title">
                              {uploadingImages ? 'Uploading...' : 'Upload Product Images'}
                            </div>
                            <div className="upload-subtitle">
                              {uploadingImages ? (
                                <div className="upload-loading">
                                  <div className="spinner"></div>
                                  Processing your images...
                                </div>
                              ) : (
                                'Drag and drop or click to browse'
                              )}
                            </div>
                          </div>
                          <input 
                            type="file" 
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(e, setFieldValue, values.images)}
                            disabled={uploadingImages}
                          />
                        </label>
                      </div>
                      
                      <ErrorMessage name="images" component="div" className="error-message" />
                      <p className="help-text">
                        💡 <strong>Tip:</strong> Upload high-quality images for better customer engagement. First image will be the main product image.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="features-section section">
                  <div className="section-content">
                    <div className="section-header">
                      <div className="section-number">5</div>
                      <h2 className="section-title">Product Features</h2>
                    </div>
                    
                    <div className="features-grid">
                      <div className="checkbox-card purple">
                        <Field
                          id="isLimitedEdition"
                          name="isLimitedEdition"
                          type="checkbox"
                          className="checkbox-input"
                        />
                        <label htmlFor="isLimitedEdition" className="checkbox-label">
                          <span style={{ color: '#8b5cf6' }}>⭐</span> Limited Edition Product
                        </label>
                      </div>
                      
                      <div className="checkbox-card pink">
                        <Field
                          id="isTrending"
                          name="isTrending"
                          type="checkbox"
                          className="checkbox-input"
                        />
                        <label htmlFor="isTrending" className="checkbox-label">
                          <span style={{ color: '#ec4899' }}>🔥</span> Mark as Trending
                        </label>
                      </div>
                    </div>
                    
                    <div className="form-group" style={{ marginTop: '1.5rem' }}>
                      <label htmlFor="tags" className="form-label">Product Tags</label>
                      <input
                        id="tags"
                        type="text"
                        className="tags-input"
                        placeholder="summer, casual, cotton, comfortable, trendy..."
                        value={values.tags.join(', ')}
                        onChange={(e) => {
                          const tagsString = e.target.value;
                          const tagsArray = tagsString
                            .split(',')
                            .map(tag => tag.trim())
                            .filter(tag => tag);
                          setFieldValue('tags', tagsArray);
                        }}
                      />
                      <p className="help-text">
                        Separate tags with commas. Tags help customers discover your product easily.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Submit Section */}
                <div className="submit-section">
                  <button
                    type="button"
                    onClick={() => navigate('/seller/dashboard')}
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
                        <div className="spinner"></div>
                        Creating Product...
                      </>
                    ) : (
                      <>
                        <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Product
                      </>
                    )}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </SellerLayout>
  );
};

export default AddProduct;