const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { generateId } = require('../utils/otp');

// Get rider profile
router.get('/profile', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, u.name, u.mobile, u.pincode, u.address
       FROM riders r JOIN users u ON r.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    res.json({ rider: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload KYC documents
router.post('/kyc', auth, async (req, res) => {
  try {
    const { aadhaar_front, aadhaar_back, selfie } = req.body;

    await pool.query(
      `UPDATE riders SET
       aadhaar_front = COALESCE($1, aadhaar_front),
       aadhaar_back = COALESCE($2, aadhaar_back),
       selfie = COALESCE($3, selfie),
       kyc_status = 'pending'
       WHERE user_id = $4`,
      [aadhaar_front, aadhaar_back, selfie, req.user.id]
    );

    res.json({ message: 'KYC documents submitted. Awaiting admin verification.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit KYC' });
  }
});

// Toggle online/offline
router.post('/toggle-status', auth, async (req, res) => {
  try {
    const { is_online } = req.body;

    await pool.query(
      'UPDATE riders SET is_online = $1 WHERE user_id = $2',
      [is_online, req.user.id]
    );

    res.json({
      message: is_online ? 'You are now ONLINE' : 'You are now OFFLINE',
      is_online
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Update live location
router.post('/location', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;

    await pool.query(
      'UPDATE riders SET current_lat = $1, current_lng = $2 WHERE user_id = $3',
      [lat, lng, req.user.id]
    );

    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// Get open orders within 5km (rider must be online)
router.get('/open-orders', auth, async (req, res) => {
  try {
    // Get rider's location and pincode
    const rider = await pool.query(
      `SELECT r.*, u.pincode FROM riders r JOIN users u ON r.user_id = u.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (rider.rows.length === 0) {
      return res.status(404).json({ error: 'Rider not found' });
    }

    if (!rider.rows[0].is_online) {
      return res.json({ orders: [], message: 'You must be online to see orders' });
    }

    // Get open orders for this pincode that need a rider
    const result = await pool.query(
      `SELECT o.*, v.shop_name, v.shop_address,
        u.name as customer_name, u.mobile as customer_mobile
       FROM orders o
       JOIN vendors v ON o.vendor_id = v.id
       JOIN users u ON o.customer_id = u.id
       WHERE o.status IN ('ready_for_pickup', 'waiting_rider')
       AND v.user_id IN (SELECT id FROM users WHERE pincode = $1)
       ORDER BY o.created_at ASC`,
      [rider.rows[0].pincode]
    );

    // Filter: only orders not already assigned to another rider
    const availableOrders = result.rows.filter(o => !o.rider_id);

    res.json({ orders: availableOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Accept an order
router.post('/accept-order/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    const rider = await pool.query('SELECT id FROM riders WHERE user_id = $1', [req.user.id]);
    if (rider.rows.length === 0) return res.status(404).json({ error: 'Rider not found' });

    // Update order with rider
    const result = await pool.query(
      `UPDATE orders SET
       rider_id = $1,
       status = 'rider_assigned',
       rider_assigned_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status IN ('ready_for_pickup', 'waiting_rider')
       AND rider_id IS NULL
       RETURNING *`,
      [rider.rows[0].id, orderId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Order no longer available' });
    }

    res.json({ message: 'Order accepted', order: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Failed to accept order' });
  }
});

// Mark picked up
router.post('/pickup/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const rider = await pool.query('SELECT id FROM riders WHERE user_id = $1', [req.user.id]);

    const result = await pool.query(
      `UPDATE orders SET status = 'picked_up', picked_up_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND rider_id = $2 AND status = 'rider_assigned'
       RETURNING *`,
      [orderId, rider.rows[0]?.id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Cannot mark as picked up' });
    }

    res.json({ message: 'Order picked up from vendor' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Mark delivered
router.post('/deliver/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { cash_collected } = req.body;

    const rider = await pool.query('SELECT id FROM riders WHERE user_id = $1', [req.user.id]);

    const result = await pool.query(
      `UPDATE orders SET status = 'delivered', delivered_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND rider_id = $2 AND status = 'picked_up'
       RETURNING *`,
      [orderId, rider.rows[0]?.id]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Cannot mark as delivered' });
    }

    // Update payment status for COD
    if (result.rows[0].payment_method === 'cod') {
      await pool.query(
        "UPDATE orders SET payment_status = 'paid' WHERE id = $1",
        [orderId]
      );
    }

    // Record rider earnings
    const earnings = await pool.query(
      "SELECT value FROM platform_settings WHERE key_name = 'rider_pay_per_delivery'"
    );
    const amount = parseFloat(earnings.rows[0]?.value || 30);

    await pool.query(
      `INSERT INTO rider_earnings (id, rider_id, order_id, amount, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [generateId('earn'), rider.rows[0].id, orderId, amount]
    );

    // Update rider delivery count
    await pool.query(
      'UPDATE riders SET total_deliveries = total_deliveries + 1 WHERE id = $1',
      [rider.rows[0].id]
    );

    res.json({ message: 'Order delivered successfully', earnings: amount });
  } catch (err) {
    res.status(500).json({ error: 'Failed to complete delivery' });
  }
});

// Get earnings
router.get('/earnings', auth, async (req, res) => {
  try {
    const rider = await pool.query('SELECT id FROM riders WHERE user_id = $1', [req.user.id]);

    const earnings = await pool.query(
      `SELECT SUM(amount) as total_earnings, COUNT(*) as total_deliveries
       FROM rider_earnings WHERE rider_id = $1 AND status IN ('pending', 'approved')`,
      [rider.rows[0]?.id]
    );

    const history = await pool.query(
      `SELECT re.*, o.order_number, o.delivered_at
       FROM rider_earnings re JOIN orders o ON re.order_id = o.id
       WHERE re.rider_id = $1 ORDER BY re.created_at DESC LIMIT 20`,
      [rider.rows[0]?.id]
    );

    const payouts = await pool.query(
      `SELECT * FROM payouts WHERE rider_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [rider.rows[0]?.id]
    );

    res.json({
      total_earnings: parseFloat(earnings.rows[0]?.total_earnings) || 0,
      total_deliveries: parseInt(earnings.rows[0]?.total_deliveries) || 0,
      history: history.rows,
      payouts: payouts.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current active delivery
router.get('/current-order', auth, async (req, res) => {
  try {
    const rider = await pool.query('SELECT id FROM riders WHERE user_id = $1', [req.user.id]);

    const result = await pool.query(
      `SELECT o.*, v.shop_name, v.shop_address,
        u.name as customer_name, u.mobile as customer_mobile, u.address as customer_address
       FROM orders o
       JOIN vendors v ON o.vendor_id = v.id
       JOIN users u ON o.customer_id = u.id
       WHERE o.rider_id = $1 AND o.status IN ('rider_assigned', 'picked_up')
       ORDER BY o.rider_assigned_at ASC LIMIT 1`,
      [rider.rows[0]?.id]
    );

    res.json({ order: result.rows[0] || null });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
