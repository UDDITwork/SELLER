const Seller = require('../models/Seller');
const { generateToken } = require('../utils/jwtToken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// @desc    Register a new seller
// @route   POST /api/sellers/register
// @access  Public
exports.registerSeller = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const {
      firstName, email, password, mobileNumber,
      shop, bankDetails
    } = req.body;

    const emailLC = email.toLowerCase();

    // Check if seller exists with email or mobile number
    const existingSeller = await Seller.findOne({
      $or: [
        { email: emailLC },
        { mobileNumber }
      ]
    });

    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: existingSeller.email === emailLC ? 
          'Email already registered' : 
          'Mobile number already registered'
      });
    }

    // ✅ FIX: Don't hash password here - let the model's pre-save hook handle it
    const seller = await Seller.create({
      firstName,
      email: emailLC,
      password, // ← Raw password - will be hashed by pre-save hook
      mobileNumber,
      shop,
      bankDetails
    });

    const token = generateToken(seller._id);

    console.log('✅ Seller registered successfully:', {
      id: seller._id,
      email: seller.email,
      firstName: seller.firstName
    });

    res.status(201).json({
      success: true,
      data: {
        _id: seller._id,
        firstName: seller.firstName,
        email: seller.email,
        mobileNumber: seller.mobileNumber,
        shop: seller.shop,
        token
      }
    });
  } catch (err) {
    console.error('❌ Registration error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// @desc    Login seller
// @route   POST /api/sellers/login
// @access  Public
exports.loginSeller = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ success: false, errors: errors.array() });

    const email = req.body.email.toLowerCase();
    const password = req.body.password;

    console.log('🔑 Login attempt for:', email);

    // Find seller and explicitly select password field
    const seller = await Seller.findOne({ email }).select('+password');
    
    if (!seller) {
      console.log('❌ Seller not found for email:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    console.log('👤 Found seller:', {
      id: seller._id,
      email: seller.email,
      firstName: seller.firstName
    });

    // ✅ FIX: Use the model's matchPassword method for consistency
    const isMatch = await seller.matchPassword(password);
    
    if (!isMatch) {
      console.log('❌ Password mismatch for:', email);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    console.log('✅ Login successful for:', email);

    const token = generateToken(seller._id);

    res.json({
      success: true,
      data: {
        _id: seller._id,
        firstName: seller.firstName,
        email: seller.email,
        mobileNumber: seller.mobileNumber,
        shop: seller.shop,
        token
      }
    });
  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// @desc    Get seller profile
// @route   GET /api/sellers/profile
// @access  Private
exports.getSellerProfile = async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller._id).select('-password');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    res.status(200).json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Upload shop images
// @route   POST /api/sellers/upload-shop-images
// @access  Private
exports.uploadShopImages = async (req, res) => {
  try {
    console.log('📸 Shop image upload request received');

    const seller = await Seller.findById(req.seller._id);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    let uploadedImages = [];
    
    if (req.body.images && Array.isArray(req.body.images)) {
      uploadedImages = req.body.images;
      console.log('📷 Processing base64 images:', uploadedImages.length);
    }

    if (req.files && req.files.length > 0) {
      const fileUrls = req.files.map(file => `/uploads/${file.filename}`);
      uploadedImages = [...uploadedImages, ...fileUrls];
      console.log('📁 Processing file uploads:', fileUrls);
    }

    if (uploadedImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    seller.shop.images = [...(seller.shop.images || []), ...uploadedImages];
    
    if (!seller.shop.mainImage && uploadedImages.length > 0) {
      seller.shop.mainImage = uploadedImages[0];
    }

    await seller.save();

    console.log('✅ Shop images uploaded successfully');
    
    res.status(200).json({
      success: true,
      message: 'Shop images uploaded successfully',
      data: {
        images: seller.shop.images,
        mainImage: seller.shop.mainImage
      }
    });

  } catch (error) {
    console.error('❌ Shop image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Update seller profile
// @route   PUT /api/sellers/profile
// @access  Private
exports.updateSellerProfile = async (req, res) => {
  try {
    console.log('🔄 Profile update request received');
    
    const seller = await Seller.findById(req.seller._id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Update fields that are sent in the request
    if (req.body.firstName) seller.firstName = req.body.firstName;
    if (req.body.email) seller.email = req.body.email;
    if (req.body.mobileNumber) seller.mobileNumber = req.body.mobileNumber;
    
    // Update shop details if provided
    if (req.body.shop) {
      if (!seller.shop) {
        seller.shop = {};
      }

      if (req.body.shop.name) seller.shop.name = req.body.shop.name;
      if (req.body.shop.address) seller.shop.address = req.body.shop.address;
      if (req.body.shop.gstNumber) seller.shop.gstNumber = req.body.shop.gstNumber;
      if (req.body.shop.phoneNumber) {
        seller.shop.phoneNumber = seller.shop.phoneNumber || {};
        if (req.body.shop.phoneNumber.main) 
          seller.shop.phoneNumber.main = req.body.shop.phoneNumber.main;
        if (req.body.shop.phoneNumber.alternate) 
          seller.shop.phoneNumber.alternate = req.body.shop.phoneNumber.alternate;
      }
      if (req.body.shop.category) seller.shop.category = req.body.shop.category;
      if (req.body.shop.openTime) seller.shop.openTime = req.body.shop.openTime;
      if (req.body.shop.closeTime) seller.shop.closeTime = req.body.shop.closeTime;
      if (req.body.shop.workingDays) seller.shop.workingDays = req.body.shop.workingDays;
      
      if (req.body.shop.images) {
        if (Array.isArray(req.body.shop.images)) {
          seller.shop.images = req.body.shop.images;
        }
      }

      if (req.body.shop.mainImage) {
        seller.shop.mainImage = req.body.shop.mainImage;
      }

      if (req.body.shop.description !== undefined) {
        seller.shop.description = req.body.shop.description;
      }
      
      if (req.body.shop.location && req.body.shop.location.coordinates) {
        seller.shop.location = {
          type: 'Point',
          coordinates: req.body.shop.location.coordinates
        };
      }
    }

    // Update bank details if provided
    if (req.body.bankDetails) {
      seller.bankDetails = seller.bankDetails || {};
      if (req.body.bankDetails.accountNumber) 
        seller.bankDetails.accountNumber = req.body.bankDetails.accountNumber;
      if (req.body.bankDetails.ifscCode) 
        seller.bankDetails.ifscCode = req.body.bankDetails.ifscCode;
      if (req.body.bankDetails.bankName) 
        seller.bankDetails.bankName = req.body.bankDetails.bankName;
      if (req.body.bankDetails.accountType) 
        seller.bankDetails.accountType = req.body.bankDetails.accountType;
    }

    // ✅ FIX: Handle password update properly
    if (req.body.password) {
      // Don't hash here - let pre-save hook handle it
      seller.password = req.body.password;
    }

    const updatedSeller = await seller.save();

    console.log('✅ Profile updated successfully');

    res.status(200).json({
      success: true,
      data: {
        _id: updatedSeller._id,
        firstName: updatedSeller.firstName,
        email: updatedSeller.email,
        mobileNumber: updatedSeller.mobileNumber,
        shop: updatedSeller.shop
      }
    });
  } catch (error) {
    console.error('❌ Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// ✅ FIX: Request Password Reset
exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();
    console.log('🔍 Checking email for password reset:', email);
    
    const seller = await Seller.findOne({ email });
    
    if (!seller) {
      console.log('❌ No seller found with email:', email);
      return res.status(404).json({ 
        success: false, 
        message: 'No account found with this email' 
      });
    }

    console.log('✅ Found seller for password reset:', {
      id: seller._id,
      email: seller.email,
      firstName: seller.firstName
    });

    const resetToken = crypto.randomBytes(20).toString('hex');
    seller.resetPasswordToken = resetToken;
    seller.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await seller.save();

    console.log('✅ Reset token generated for:', email);

    res.json({ 
      success: true, 
      message: 'Password reset link sent to your email', 
      devToken: resetToken 
    });
  } catch (err) {
    console.error('❌ Forgot password error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// Verify Reset Token
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const seller = await Seller.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!seller) {
      return res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired'
      });
    }
    
    return res.status(200).json({
      success: true,
      message: 'Token is valid'
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error processing your request'
    });
  }
};

// ✅ FIX: Reset Password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    const seller = await Seller.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!seller) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password reset token is invalid or has expired' 
      });
    }

    // ✅ FIX: Don't hash here - let pre-save hook handle it
    seller.password = password;
    seller.resetPasswordToken = undefined;
    seller.resetPasswordExpires = undefined;
    
    await seller.save();

    console.log('✅ Password reset successfully for:', seller.email);

    res.json({ 
      success: true, 
      message: 'Password has been reset successfully' 
    });
  } catch (err) {
    console.error('❌ Reset password error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};

// ✅ FIX: Direct Password Reset (no token required)
exports.resetPasswordDirect = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const emailLC = email.toLowerCase();
    console.log('🔄 Direct password reset for:', emailLC);
    
    const seller = await Seller.findOne({ email: emailLC });
    
    if (!seller) {
      console.log('❌ No seller found with email:', emailLC);
      return res.status(404).json({
        success: false,
        message: 'Seller with this email does not exist'
      });
    }
    
    console.log('✅ Found seller for direct reset:', {
      id: seller._id,
      email: seller.email
    });
    
    // ✅ FIX: Don't hash here - let pre-save hook handle it
    seller.password = password;
    
    await seller.save();
    
    console.log('✅ Password reset directly for:', emailLC);
    
    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};

// ✅ FIX: Check if email exists
exports.checkEmailExists = async (req, res) => {
  try {
    const email = req.body.email.toLowerCase();
    console.log('🔍 Checking if email exists:', email);
    
    const seller = await Seller.findOne({ email });
    const exists = !!seller;
    
    console.log(`${exists ? '✅' : '❌'} Email exists check:`, { email, exists });
    
    if (exists) {
      console.log('📋 Found seller:', {
        id: seller._id,
        firstName: seller.firstName,
        email: seller.email
      });
    }
    
    res.json({ 
      success: true, 
      exists 
    });
  } catch (err) {
    console.error('❌ Email check error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: err.message 
    });
  }
};