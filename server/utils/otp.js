const { v4: uuidv4 } = require('uuid');

// In-memory OTP store (use Redis in production)
// Format: { mobile: { otp: '1234', expiresAt: timestamp } }
const otpStore = new Map();

// Generate 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// Store OTP with 5-minute expiry
const storeOTP = (mobile, otp) => {
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  otpStore.set(mobile, { otp, expiresAt });
};

// Verify OTP
const verifyOTP = (mobile, otp) => {
  const record = otpStore.get(mobile);
  if (!record) return false;
  if (Date.now() > record.expiresAt) {
    otpStore.delete(mobile);
    return false;
  }
  if (record.otp !== otp) return false;
  otpStore.delete(mobile); // One-time use
  return true;
};

// Mock SMS send (replace with MSG91/Fast2SMS in production)
const sendSMS = async (mobile, message) => {
  console.log(`📱 SMS to ${mobile}: ${message}`);
  // In production, integrate with SMS provider:
  // const response = await fetch(`https://api.msg91.com/api/v5/otp?authkey=${process.env.SMS_API_KEY}&mobile=${mobile}&message=${message}`);
  return true;
};

// Generate unique ID
const generateId = (prefix) => {
  return `${prefix}_${uuidv4()}`;
};

module.exports = { generateOTP, storeOTP, verifyOTP, sendSMS, generateId };
