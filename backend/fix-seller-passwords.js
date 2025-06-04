// Script to fix double-hashed passwords in the database
// ⚠️ IMPORTANT: Only run this if you're sure you have double-hashed passwords
// Run this in your backend directory: node fix-seller-passwords.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Your models (adjust path as needed)
const Seller = require('./models/Seller');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/zammernow', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function fixSellerPasswords() {
  try {
    console.log('🔧 Seller Password Fix Utility\n');
    
    console.log('This script will help fix double-hashed passwords in your database.');
    console.log('⚠️  WARNING: This will modify your database. Make a backup first!\n');
    
    const proceed = await askQuestion('Do you want to proceed? (yes/no): ');
    if (proceed.toLowerCase() !== 'yes') {
      console.log('Operation cancelled.');
      return;
    }

    console.log('\n1️⃣ Finding all sellers...');
    const sellers = await Seller.find({}).select('+password');
    console.log(`Found ${sellers.length} sellers in database\n`);

    for (const seller of sellers) {
      console.log(`\n👤 Processing: ${seller.firstName} (${seller.email})`);
      console.log(`   Current password hash: ${seller.password.substring(0, 20)}...`);
      console.log(`   Hash length: ${seller.password.length}`);
      
      // Check if password looks double-hashed (unusually long)
      if (seller.password.length > 80) {
        console.log('   ⚠️  Suspicious hash length - likely double-hashed');
        
        const fix = await askQuestion(`   Fix this seller's password? (yes/no/skip): `);
        
        if (fix.toLowerCase() === 'yes') {
          // Ask for new password
          const newPassword = await askQuestion(`   Enter new password for ${seller.firstName}: `);
          
          if (newPassword.length < 6) {
            console.log('   ❌ Password too short (min 6 chars). Skipping...');
            continue;
          }
          
          // Update password (let the pre-save hook hash it properly)
          seller.password = newPassword;
          await seller.save();
          
          console.log('   ✅ Password updated successfully');
        } else if (fix.toLowerCase() === 'skip') {
          continue;
        } else {
          console.log('   ⏭️  Skipped');
        }
      } else {
        console.log('   ✅ Password hash looks normal');
      }
    }

    console.log('\n🎉 Password fix process completed!');
    
  } catch (error) {
    console.error('❌ Fix process failed:', error);
  } finally {
    rl.close();
    await mongoose.disconnect();
    console.log('\n🔚 Database connection closed');
  }
}

// Alternative: Reset specific seller password
async function resetSpecificSeller() {
  try {
    console.log('🎯 Reset Specific Seller Password\n');
    
    const email = await askQuestion('Enter seller email: ');
    const newPassword = await askQuestion('Enter new password: ');
    
    if (newPassword.length < 6) {
      console.log('❌ Password too short (min 6 chars)');
      return;
    }
    
    const seller = await Seller.findOne({ email: email.toLowerCase() });
    
    if (!seller) {
      console.log('❌ Seller not found');
      return;
    }
    
    seller.password = newPassword;
    await seller.save();
    
    console.log('✅ Password reset successfully for:', seller.firstName);
    
  } catch (error) {
    console.error('❌ Reset failed:', error);
  } finally {
    rl.close();
    await mongoose.disconnect();
  }
}

// Main menu
async function main() {
  console.log('Choose an option:');
  console.log('1. Fix all sellers with suspicious passwords');
  console.log('2. Reset specific seller password');
  
  const choice = await askQuestion('Enter choice (1 or 2): ');
  
  if (choice === '1') {
    await fixSellerPasswords();
  } else if (choice === '2') {
    await resetSpecificSeller();
  } else {
    console.log('Invalid choice');
    rl.close();
    await mongoose.disconnect();
  }
}

// Run the main function
main();