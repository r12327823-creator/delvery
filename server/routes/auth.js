const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { generateOTP, storeOTP, verifyOTP, sendSMS, generateId } = require('../utils/otp');

// Step 1: Request OTP
router.post('/request-otp', async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ error: 'Please provide a valid 10-digit mobile number.' });
    }

    const otp = generateOTP();
    storeOTP(mobile, otp);
    await sendSMS(mobile, `Your Market2Home OTP is: ${otp}. Valid for 5 minutes.`);

    // In development, return OTP for testing (remove in production)
    if (process.env.NODE_ENV === 'development') {
      return res.json({ message: 'OTP sent successfully', otp }); // DEV ONLY
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    console.error('OTP request error:', err);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// Step 2: Verify OTP & Login/Register
router.post('/verify-otp', async (req, res) => {
  try {
    const { mobile, otp, name, role = 'customer', pincode } = req.body;

    if (!mobile || !otp) {
      return res.status(400).json({ error: 'Mobile and OTP are required.' });
    }

    // Verify OTP
    if (!verifyOTP(mobile, otp)) {
      return res.status(401).json({ error: 'Invalid or expired OTP.' });
    }

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE mobile = $1',
      [mobile]
    );

    if (existingUser.rows.length > 0) {
      // Existing user - login
      const user = existingUser.rows[0];

      // For riders, check KYC status
      if (user.role === 'rider') {
        const rider = await pool.query(
          'SELECT kyc_status FROM riders WHERE user_id = $1',
          [user.id]
        );
        if (rider.rows[0]?.kyc_status !== 'approved') {
          return res.status(403).json({
            error: 'Your KYC is not approved yet. Please wait for admin verification.',
            status: 'kyc_pending'
          });
        }
      }

      const token = jwt.sign(
        { id: user.id, mobile: user.mobile, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          mobile: user.mobile,
          name: user.name,
          role: user.role,
          pincode: user.pincode
        }
      });
    }

    // New user - register
    if (!name || !pincode) {
      return res.status(400).json({ error: 'Name and pincode are required for registration.' });
    }

    // Check pincode is serviceable
    const pincodeCheck = await pool.query(
      'SELECT * FROM pincodes WHERE pincode = $1 AND is_active = true',
      [pincode]
    );

    if (pincodeCheck.rows.length === 0) {
      return res.status(400).json({
        error: 'Service not available in your area yet. We\'ll notify you when we launch here.',
        serviceAvailable: false
      });
    }

    const userId = generateId(role);
    const newUser = await pool.query(
      `INSERT INTO users (id, mobile, name, role, pincode, address)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, mobile, name, role, pincode, '']
    );

    // For vendors, create vendor record
    if (role === 'vendor') {
      await pool.query(
        `INSERT INTO vendors (id, user_id, shop_name, status) VALUES ($1, $2, $3, 'pending')`,
        [generateId('vendor'), userId, name]
      );
    }

    // For riders, create rider record
    if (role === 'rider') {
      await pool.query(
        `INSERT INTO riders (id, user_id, kyc_status) VALUES ($1, $2, 'pending')`,
        [generateId('rider'), userId]
      );
    }

    const token = jwt.sign(
      { id: userId, mobile, role, pincode },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: userId,
        mobile,
        name,
        role,
        pincode
      }
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Not authenticated' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: user.rows[0] });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
