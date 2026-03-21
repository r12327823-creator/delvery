const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { generateId } = require('../utils/otp');

// Check pincode service availability
router.get('/check-pincode/:pincode', async (req, res) => {
  try {
    const { pincode } = req.params;
    const result = await pool.query(
      'SELECT * FROM pincodes WHERE pincode = $1 AND is_active = true',
      [pincode]
    );

    if (result.rows.length > 0) {
      res.json({ available: true, city: result.rows[0].city });
    } else {
      res.json({ available: false, message: "Service not available in your area yet. We'll notify you when we launch here." });
    }
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all vendors (with optional category filter)
router.get('/vendors', async (req, res) => {
  try {
    const { category, pincode } = req.query;
    let query = `
      SELECT v.*, u.name as owner_name, u.mobile
      FROM vendors v
      JOIN users u ON v.user_id = u.id
      WHERE v.status = 'approved' AND u.is_active = true
    `;
    const params = [];

    if (category) {
      params.push(category);
      query += ` AND v.category = $${params.length}`;
    }

    if (pincode) {
      params.push(pincode);
      query += ` AND u.pincode = $${params.length}`;
    }

    query += ' ORDER BY v.created_at DESC';
    const result = await pool.query(query, params);
    res.json({ vendors: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Get vendor details with products
router.get('/vendors/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await pool.query(
      `SELECT v.*, u.name as owner_name, u.mobile, u.pincode
       FROM vendors v JOIN users u ON v.user_id = u.id WHERE v.id = $1`,
      [id]
    );

    if (vendor.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const products = await pool.query(
      `SELECT * FROM products WHERE vendor_id = $1 AND is_active = true ORDER BY name`,
      [id]
    );

    res.json({ vendor: vendor.rows[0], products: products.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    const { q, pincode } = req.query;
    if (!q) return res.json({ products: [] });

    let query = `
      SELECT p.*, v.shop_name, v.id as vendor_id
      FROM products p
      JOIN vendors v ON p.vendor_id = v.id
      JOIN users u ON v.user_id = u.id
      WHERE p.is_active = true AND v.status = 'approved'
      AND (p.name ILIKE $1 OR v.shop_name ILIKE $1)
    `;
    const params = [`%${q}%`];

    if (pincode) {
      params.push(pincode);
      query += ` AND u.pincode = $${params.length}`;
    }

    query += ' ORDER BY p.name LIMIT 50';
    const result = await pool.query(query, params);
    res.json({ products: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// Place order
router.post('/orders', auth, async (req, res) => {
  try {
    const { vendor_id, items, drop_address, drop_lat, drop_lng, payment_method = 'cod', pincode } = req.body;

    if (!vendor_id || !items || items.length === 0 || !drop_address) {
      return res.status(400).json({ error: 'Missing required order details' });
    }

    // Get delivery fee from settings
    const deliveryFee = await pool.query(
      "SELECT value FROM platform_settings WHERE key_name = 'delivery_fee'"
    );
    const fee = parseFloat(deliveryFee.rows[0]?.value || 40);

    // Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      subtotal += parseFloat(item.price) * parseInt(item.quantity);
    }

    // Get vendor details for pickup address
    const vendor = await pool.query(
      `SELECT v.*, u.name, u.pincode, u.address as user_address
       FROM vendors v JOIN users u ON v.user_id = u.id WHERE v.id = $1`,
      [vendor_id]
    );

    if (vendor.rows.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const orderId = generateId('ord');
    const orderNumber = `M2H${Date.now().toString().slice(-8)}`;

    const result = await pool.query(
      `INSERT INTO orders (
        id, order_number, customer_id, vendor_id, status,
        items, subtotal, delivery_fee, total_amount,
        payment_method, payment_status, pickup_address,
        drop_address, drop_lat, drop_lng, pickup_lat, pickup_lng
      ) VALUES ($1, $2, $3, $4, 'placed', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        orderId, orderNumber, req.user.id, vendor_id,
        JSON.stringify(items), subtotal, fee, subtotal + fee,
        payment_method,
        payment_method === 'upi' ? 'paid' : 'pending',
        `${vendor.rows[0].shop_name}, ${vendor.rows[0].user_address || ''}`,
        drop_address, drop_lat || 0, drop_lng || 0,
        vendor.rows[0].lat || 0, vendor.rows[0].lng || 0
      ]
    );

    res.status(201).json({
      message: 'Order placed successfully',
      order: result.rows[0]
    });
  } catch (err) {
    console.error('Order placement error:', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// Get my orders
router.get('/orders', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT o.*, v.shop_name,
        r.user_id as rider_user_id, ru.name as rider_name, ru.mobile as rider_mobile
      FROM orders o
      JOIN vendors v ON o.vendor_id = v.id
      LEFT JOIN riders r ON o.rider_id = r.id
      LEFT JOIN users ru ON r.user_id = ru.id
      WHERE o.customer_id = $1
    `;
    const params = [req.user.id];

    if (status) {
      params.push(status);
      query += ` AND o.status = $${params.length}`;
    }

    query += ' ORDER BY o.created_at DESC LIMIT 50';
    const result = await pool.query(query, params);
    res.json({ orders: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get order details with tracking
router.get('/orders/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT o.*, v.shop_name, v.shop_address,
        ru.name as rider_name, ru.mobile as rider_mobile,
        r.current_lat, r.current_lng
       FROM orders o
       JOIN vendors v ON o.vendor_id = v.id
       LEFT JOIN riders r ON o.rider_id = r.id
       LEFT JOIN users ru ON r.user_id = ru.id
       WHERE o.id = $1 AND o.customer_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get rider live location (for order tracking)
router.get('/orders/:id/rider-location', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT r.current_lat, r.current_lng, o.status, o.pickup_address, o.drop_address
       FROM orders o JOIN riders r ON o.rider_id = r.id
       WHERE o.id = $1 AND o.customer_id = $2`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ location: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
