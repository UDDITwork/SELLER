const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password should be at least 6 characters'],
    select: false // ✅ Explicitly exclude from queries by default
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    unique: true,
    trim: true
  },
  shop: {
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Shop address is required'],
      trim: true
    },
    gstNumber: {
      type: String,
      default: '',
      trim: true
    },
    phoneNumber: {
      main: {
        type: String,
        default: '',
        trim: true
      },
      alternate: {
        type: String,
        default: '',
        trim: true
      }
    },
    category: {
      type: String,
      enum: {
        values: ['Men', 'Women', 'Kids'],
        message: 'Category must be Men, Women, or Kids'
      },
      required: [true, 'Shop category is required']
    },
    openTime: {
      type: String,
      default: '09:00'
    },
    closeTime: {
      type: String,
      default: '18:00'
    },
    workingDays: {
      type: String,
      default: 'monday-saturday'
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point']
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
        validate: {
          validator: function(coordinates) {
            return coordinates.length === 2;
          },
          message: 'Coordinates must be an array of 2 numbers [longitude, latitude]'
        }
      }
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: function(images) {
          return images.length <= 10; // Limit to 10 images
        },
        message: 'Cannot have more than 10 shop images'
      }
    },
    mainImage: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Shop description cannot be more than 500 characters'],
      trim: true
    }
  },
  bankDetails: {
    accountNumber: {
      type: String,
      default: '',
      trim: true
    },
    ifscCode: {
      type: String,
      default: '',
      uppercase: true,
      trim: true
    },
    bankName: {
      type: String,
      default: '',
      trim: true
    },
    accountType: {
      type: String,
      enum: {
        values: ['savings', 'current', 'business', ''],
        message: 'Account type must be savings, current, or business'
      },
      default: ''
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  resetPasswordToken: {
    type: String,
    select: false
  },
  resetPasswordExpires: {
    type: Date,
    select: false
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ✅ Index for geolocation queries
sellerSchema.index({ "shop.location": "2dsphere" });

// ✅ Index for email and mobile for faster lookups
sellerSchema.index({ email: 1 });
sellerSchema.index({ mobileNumber: 1 });

// ✅ FIXED: Hash password before saving (only when modified)
sellerSchema.pre('save', async function(next) {
  // Only hash password if it's been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    console.log('🔐 Hashing password for seller:', this.email);
    
    // Generate salt and hash password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    console.log('✅ Password hashed successfully');
    next();
  } catch (error) {
    console.error('❌ Password hashing error:', error);
    next(error);
  }
});

// ✅ Update timestamp before saving
sellerSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

// ✅ Method to check password
sellerSchema.methods.matchPassword = async function(enteredPassword) {
  try {
    console.log('🔍 Comparing password for seller:', this.email);
    const isMatch = await bcrypt.compare(enteredPassword, this.password);
    console.log(`${isMatch ? '✅' : '❌'} Password match result:`, isMatch);
    return isMatch;
  } catch (error) {
    console.error('❌ Password comparison error:', error);
    return false;
  }
};

// ✅ Method to get main shop image or default
sellerSchema.methods.getMainShopImage = function() {
  if (this.shop.mainImage) {
    return this.shop.mainImage;
  }
  if (this.shop.images && this.shop.images.length > 0) {
    return this.shop.images[0];
  }
  return null;
};

// ✅ Virtual for shop image URL
sellerSchema.virtual('shop.mainImageUrl').get(function() {
  const mainImage = this.getMainShopImage();
  if (mainImage) {
    // If it's already a full URL (starts with http), return as is
    if (mainImage.startsWith('http') || mainImage.startsWith('data:')) {
      return mainImage;
    }
    // Otherwise, construct the URL (for uploaded files)
    return `/uploads/${mainImage}`;
  }
  return null;
});

// ✅ Virtual for full name
sellerSchema.virtual('fullName').get(function() {
  return this.firstName;
});

// ✅ Virtual for shop status
sellerSchema.virtual('shop.status').get(function() {
  if (!this.isActive) return 'inactive';
  if (!this.isVerified) return 'pending';
  return 'active';
});

// ✅ Method to get seller for response (exclude sensitive data)
sellerSchema.methods.toAuthJSON = function() {
  return {
    _id: this._id,
    firstName: this.firstName,
    email: this.email,
    mobileNumber: this.mobileNumber,
    shop: this.shop,
    bankDetails: this.bankDetails,
    isVerified: this.isVerified,
    isActive: this.isActive,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// ✅ Static method to find by email
sellerSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// ✅ Static method to find with password
sellerSchema.statics.findByEmailWithPassword = function(email) {
  return this.findOne({ email: email.toLowerCase() }).select('+password');
};

const Seller = mongoose.model('Seller', sellerSchema);

module.exports = Seller;